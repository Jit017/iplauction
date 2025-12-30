import {
  Player,
  Team,
  AuctionStatus,
  AuctionState,
} from './types';
import {
  validateAuctionPrice,
  validateBidAmount,
  PriceValidationError,
} from './auction-price-validator';
import { getNextBid } from './bid-utils';
import { isPlayerRetained, validatePlayerForAuction, isPlayerAvailableForAuction } from './auction-pool';
import { defaultOverseasCheck } from './squad-validator';
import { aiBidWithStopping } from './ai-bidding';

/**
 * Auction event types for subscription
 */
export enum AuctionEventType {
  STATE_CHANGED = 'state_changed',
  PLAYER_SET = 'player_set',
  BID_PLACED = 'bid_placed',
  TIMER_TICK = 'timer_tick',
  TIMER_EXPIRED = 'timer_expired',
  AUCTION_ENDED = 'auction_ended',
  PLAYER_SOLD = 'player_sold',
  PLAYER_UNSOLD = 'player_unsold',
  ERROR = 'error',
}

/**
 * Auction event payload
 */
export interface AuctionEvent {
  type: AuctionEventType;
  state: AuctionState;
  data?: any;
  error?: string;
}

/**
 * Subscription callback function type
 */
export type AuctionSubscription = (event: AuctionEvent) => void;

/**
 * Configuration for the auction engine
 */
export interface AuctionEngineConfig {
  /** Initial timer duration in seconds */
  timerDuration?: number;
  /** Bid increment amount (deprecated - now uses IPL-style increments via getNextBid) */
  bidIncrement?: number;
  /** Timer tick interval in milliseconds (for countdown) */
  tickInterval?: number;
}

/**
 * Default auction engine configuration
 */
const DEFAULT_CONFIG: Required<AuctionEngineConfig> = {
  timerDuration: 30, // 30 seconds default
  bidIncrement: 0.25, // Deprecated - increments now follow IPL rules via getNextBid()
  tickInterval: 1000, // 1 second
};

/**
 * Auction Engine State Machine
 *
 * Manages the complete auction lifecycle with state transitions,
 * timer management, bid processing, and team updates.
 */
export class AuctionEngine {
  private state: AuctionState;
  private teams: Team[];
  private config: Required<AuctionEngineConfig>;
  private subscriptions: Set<AuctionSubscription> = new Set();
  private timerInterval: NodeJS.Timeout | null = null;
  private lastBidTime: number = 0;
  private userSelectedTeamId: string | null = null;
  private aiBidProcessedThisTick: boolean = false;

  /**
   * Creates a new auction engine instance
   *
   * @param teams - Array of teams participating in the auction
   * @param config - Optional configuration for the auction engine
   */
  constructor(teams: Team[], config: AuctionEngineConfig = {}) {
    this.teams = teams;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      currentPlayer: null,
      currentBid: 0,
      leadingTeam: null,
      timer: 0,
      status: AuctionStatus.IDLE,
    };
    this.userSelectedTeamId = null;
    this.aiBidProcessedThisTick = false;
  }

  /**
   * Set the user-selected team ID (for AI bidding exclusion)
   */
  setUserSelectedTeam(teamId: string | null): void {
    this.userSelectedTeamId = teamId;
  }

  /**
   * Subscribe to auction events
   *
   * @param callback - Function to call when events occur
   * @returns Unsubscribe function
   */
  subscribe(callback: AuctionSubscription): () => void {
    this.subscriptions.add(callback);
    return () => {
      this.subscriptions.delete(callback);
    };
  }

  /**
   * Emit an event to all subscribers
   */
  private emit(event: AuctionEvent): void {
    this.subscriptions.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in subscription callback:', error);
      }
    });
  }

  /**
   * Update state and notify subscribers
   */
  private updateState(updates: Partial<AuctionState>): void {
    this.state = { ...this.state, ...updates };
    this.emit({
      type: AuctionEventType.STATE_CHANGED,
      state: this.state,
    });
  }

  /**
   * Set the current player to be auctioned
   *
   * @param player - Player to auction
   * @throws {Error} If auction is not in IDLE state or player is retained
   */
  setCurrentPlayer(player: Player): void {
    if (this.state.status !== AuctionStatus.IDLE) {
      throw new Error(
        `Cannot set player when auction is in ${this.state.status} state`
      );
    }

    // CRITICAL VALIDATION: Ensure player is not retained
    if (isPlayerRetained(player, this.teams)) {
      const retainingTeam = this.teams.find(t => 
        t.retainedPlayers.some(p => p.id === player.id)
      );
      const error = `CRITICAL: Cannot auction retained player "${player.name}" (retained by ${retainingTeam?.name || 'a team'})`;
      this.emit({
        type: AuctionEventType.ERROR,
        state: this.state,
        error,
      });
      throw new Error(error);
    }
    
    // Additional validation: Ensure player is not in any squad
    if (!isPlayerAvailableForAuction(player, this.teams)) {
      const error = `Cannot auction player "${player.name}" - player is retained or already in a squad`;
      this.emit({
        type: AuctionEventType.ERROR,
        state: this.state,
        error,
      });
      throw new Error(error);
    }

    // Final validation to ensure player is available for auction
    try {
      validatePlayerForAuction(player, this.teams);
    } catch (error: any) {
      this.emit({
        type: AuctionEventType.ERROR,
        state: this.state,
        error: error.message || 'Player is not available for auction',
      });
      throw error;
    }

    this.updateState({
      currentPlayer: player,
      currentBid: player.basePrice,
      leadingTeam: null,
      status: AuctionStatus.BIDDING,
      timer: this.config.timerDuration,
    });

    this.emit({
      type: AuctionEventType.PLAYER_SET,
      state: this.state,
      data: { player },
    });

    this.startTimer();
    
    // Trigger initial AI bidding after a short delay when player is set
    // This ensures AI teams can bid even if no one bids initially
    setTimeout(() => {
      if (this.state.status === AuctionStatus.BIDDING && this.state.currentPlayer) {
        this.processAIBidding();
      }
    }, 1000); // 1 second delay to allow UI to update
  }

  /**
   * Start the auction timer
   */
  private startTimer(): void {
    this.stopTimer(); // Clear any existing timer

    this.timerInterval = setInterval(() => {
      if (this.state.timer > 0) {
        const newTimer = this.state.timer - 1;
        this.updateState({ timer: newTimer });
        
        // Reset AI bid flag for new tick
        this.aiBidProcessedThisTick = false;
        
        this.emit({
          type: AuctionEventType.TIMER_TICK,
          state: this.state,
          data: { timer: newTimer },
        });

        // Process AI bidding on each tick (only if auction is active)
        if (this.state.status === AuctionStatus.BIDDING && this.state.currentPlayer) {
          this.processAIBidding();
        }

        // Check if timer expired
        if (newTimer === 0) {
          this.handleTimerExpiry();
        }
      }
    }, this.config.tickInterval);
  }

  /**
   * Stop the auction timer
   */
  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Handle timer expiry
   * 
   * When timer expires:
   * - If there's a leading team with a valid bid >= base price, sell to that team
   * - If no bids occurred (no leading team), mark as UNSOLD
   * - User skipping doesn't affect the outcome - highest bidder wins
   */
  private handleTimerExpiry(): void {
    this.stopTimer();

    this.emit({
      type: AuctionEventType.TIMER_EXPIRED,
      state: this.state,
    });

    if (!this.state.currentPlayer) {
      this.endAuctionAsUnsold('No player set');
      return;
    }

    const player = this.state.currentPlayer;
    const currentBid = this.state.currentBid;
    const leadingTeam = this.state.leadingTeam;

    // Check if no bids occurred (bid is still at base price and no leading team)
    // This means no one bid at all, not even AI teams
    const noBidsOccurred = 
      currentBid === player.basePrice && 
      leadingTeam === null;

    if (noBidsOccurred) {
      // No bids received from anyone - mark as UNSOLD
      this.endAuctionAsUnsold('No bids received before timer ended');
      return;
    }

    // If there's a leading team, we have a bidder (could be AI or user)
    // Check if the bid is valid (>= base price)
    if (leadingTeam && currentBid >= player.basePrice) {
      // We have a valid bid from a team - sell to the highest bidder
      // This works regardless of whether user bid or skipped
      const validation = validateAuctionPrice(
        currentBid,
        player,
        true // timer expired
      );

      if (validation.canEnd) {
        // Auction can end - sell the player to the leading team
        this.endAuctionAsSold();
      } else if (validation.mustExtend) {
        // Auction must continue - extend timer (bid below minPrice)
        this.extendTimer();
      } else {
        // Invalid state - end as unsold
        this.endAuctionAsUnsold(validation.error || 'Invalid auction state');
      }
      return;
    }

    // Check if bid is below base price - do not force sale
    if (currentBid < player.basePrice) {
      this.endAuctionAsUnsold(`Bid (${currentBid}) is below base price (${player.basePrice})`);
      return;
    }

    // Fallback: if we have a leading team but something went wrong, try to sell
    if (leadingTeam) {
      console.warn('Unexpected state: leading team exists but validation failed. Attempting to sell...');
      this.endAuctionAsSold();
      return;
    }

    // No valid bidder - mark as unsold
    this.endAuctionAsUnsold('No valid bidder found');
  }

  /**
   * Extend the timer when bid is below minPrice
   */
  private extendTimer(): void {
    this.updateState({
      timer: this.config.timerDuration,
    });
    this.startTimer();

    this.emit({
      type: AuctionEventType.STATE_CHANGED,
      state: this.state,
      data: { reason: 'Timer extended - bid below minPrice' },
    });
  }

  /**
   * Place a manual bid by team ID
   * Convenience method that finds the team and places a bid
   *
   * @param teamId - ID of the team placing the bid
   * @param bidAmount - Optional bid amount (if not provided, uses IPL increment logic)
   * @throws {Error} If team not found, bid is invalid, or auction is not in BIDDING state
   */
  placeManualBid(teamId: string, bidAmount?: number): void {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    this.acceptBid(team, bidAmount);
  }

  /**
   * Accept a bid from a team
   *
   * @param team - Team placing the bid
   * @param bidAmount - Optional bid amount (if not provided, uses IPL increment logic)
   * @throws {Error} If bid is invalid or auction is not in BIDDING state
   */
  acceptBid(team: Team, bidAmount?: number): void {
    if (this.state.status !== AuctionStatus.BIDDING) {
      throw new Error(
        `Cannot accept bid when auction is in ${this.state.status} state`
      );
    }

    if (!this.state.currentPlayer) {
      throw new Error('No player is currently being auctioned');
    }

    // Calculate next bid amount using IPL-style increments
    const nextBid =
      bidAmount !== undefined
        ? bidAmount
        : getNextBid(this.state.currentBid);

    // Validate bid amount using price guard
    try {
      validateBidAmount(nextBid, this.state.currentPlayer);
    } catch (error) {
      if (error instanceof PriceValidationError) {
        this.emit({
          type: AuctionEventType.ERROR,
          state: this.state,
          error: error.message,
        });
        throw error;
      }
      throw error;
    }

    // Check if team has enough purse
    if (team.purse < nextBid) {
      const error = `Team ${team.name} has insufficient purse. Required: ${nextBid}, Available: ${team.purse}`;
      this.emit({
        type: AuctionEventType.ERROR,
        state: this.state,
        error,
      });
      throw new Error(error);
    }

    // Update state with new bid
    this.updateState({
      currentBid: nextBid,
      leadingTeam: team,
      timer: this.config.timerDuration, // Reset timer on new bid
    });

    this.lastBidTime = Date.now();
    
    // Reset AI bid flag when a bid is placed
    this.aiBidProcessedThisTick = false;

    this.emit({
      type: AuctionEventType.BID_PLACED,
      state: this.state,
      data: {
        team,
        bidAmount: nextBid,
        previousBid: this.state.currentBid,
      },
    });

    // Restart timer since new bid was placed
    this.startTimer();
    
    // Trigger immediate AI response to new bid (competitive reaction)
    // Use a small delay to make it feel natural but responsive
    setTimeout(() => {
      if (this.state.status === AuctionStatus.BIDDING && this.state.currentPlayer) {
        this.processAIBidding();
      }
    }, 300); // 300ms delay for competitive but not instant response
  }

  /**
   * Process AI bidding for all AI-controlled teams
   * Called on each timer tick and immediately after new bids
   * Enhanced to react competitively to new leading bids
   */
  private processAIBidding(): void {
    // Prevent multiple AI bids in the same processing cycle
    if (this.aiBidProcessedThisTick) {
      return;
    }

    // Don't process AI bidding if timer has expired or auction isn't active
    if (this.state.timer === 0 || this.state.status !== AuctionStatus.BIDDING) {
      return;
    }

    // Don't process if no player is set
    if (!this.state.currentPlayer) {
      return;
    }

    const currentBid = this.state.currentBid || 0;
    const player = this.state.currentPlayer;
    const leadingTeamId = this.state.leadingTeam?.id;

    // Collect all potential bidders (excluding leading team and user's team)
    const potentialBidders = this.teams.filter(team => 
      team.id !== this.userSelectedTeamId && 
      team.id !== leadingTeamId
    );

    // Debug logging
    if (potentialBidders.length === 0) {
      console.debug('No potential AI bidders available');
      return;
    }

    // Shuffle teams for more realistic bidding order (not always same order)
    const shuffledBidders = [...potentialBidders].sort(() => Math.random() - 0.5);

    // Iterate through potential bidders
    for (const team of shuffledBidders) {
      // Re-check state hasn't changed (leading team might have changed)
      if (this.state.leadingTeam?.id !== leadingTeamId) {
        // Leading team changed, re-evaluate
        break;
      }

      // Check if team can bid using enhanced AI logic
      try {
        const aiResult = aiBidWithStopping(team, player, currentBid, 0, {
          useRatingBands: true,
        });

        if (aiResult.shouldBid && aiResult.bidAmount) {
          // Validate the bid before placing
          try {
            validateBidAmount(aiResult.bidAmount, player);
            
            // Check if team has enough purse
            if (team.purse >= aiResult.bidAmount) {
              // Place the AI bid immediately (competitive response)
              console.log(`AI: ${team.name} bidding ${aiResult.bidAmount} Cr for ${player.name}`);
              this.acceptBid(team, aiResult.bidAmount);
              this.aiBidProcessedThisTick = true;
              
              // Only allow one AI bid per processing cycle
              // This prevents multiple simultaneous bids but allows
              // re-evaluation after each new bid
              break;
            } else {
              console.debug(`AI: ${team.name} cannot afford ${aiResult.bidAmount} Cr (purse: ${team.purse})`);
            }
          } catch (error) {
            // Log validation errors for debugging
            console.debug(`AI bid validation failed for ${team.name}:`, error);
          }
        } else {
          console.debug(`AI: ${team.name} decided not to bid. Reason: ${aiResult.reason}`);
        }
      } catch (error) {
        // Log errors for debugging
        console.debug(`AI bidding error for ${team.name}:`, error);
      }
    }
  }

  /**
   * End auction as SOLD
   * Sells the player to the leading team (highest bidder)
   * Works regardless of whether user bid or skipped - highest bidder wins
   */
  private endAuctionAsSold(): void {
    if (!this.state.currentPlayer || !this.state.leadingTeam) {
      this.endAuctionAsUnsold('No leading team or player');
      return;
    }

    const player = this.state.currentPlayer;
    const team = this.state.leadingTeam;
    const bidAmount = this.state.currentBid;

    // Do not force sale below base price
    if (bidAmount < player.basePrice) {
      this.endAuctionAsUnsold(
        `Cannot sell below base price. Bid: ${bidAmount}, Base: ${player.basePrice}`
      );
      return;
    }

    // Log the sale for debugging - shows player sold to highest bidder
    console.log(`✓ Player ${player.name} SOLD to ${team.name} for ${bidAmount} Cr (highest bidder)`);

    // Find team in teams array and update
    const teamIndex = this.teams.findIndex((t) => t.id === team.id);
    if (teamIndex === -1) {
      throw new Error(`Team ${team.id} not found`);
    }

    // Deduct purse
    this.teams[teamIndex].purse -= bidAmount;

    // Add player to squad
    this.teams[teamIndex].squad.push(player);

    // Update overseas count if player is overseas
    if (defaultOverseasCheck(player)) {
      this.teams[teamIndex].overseasCount++;
    }

    // Update leading team reference
    const updatedTeam = this.teams[teamIndex];

    this.updateState({
      status: AuctionStatus.SOLD,
      timer: 0,
      leadingTeam: updatedTeam,
    });

    this.emit({
      type: AuctionEventType.PLAYER_SOLD,
      state: this.state,
      data: {
        player,
        team: updatedTeam,
        bidAmount,
      },
    });

    this.emit({
      type: AuctionEventType.AUCTION_ENDED,
      state: this.state,
      data: { result: 'SOLD' },
    });
  }

  /**
   * End auction as UNSOLD
   *
   * @param reason - Reason for unsold status
   */
  private endAuctionAsUnsold(reason: string = 'No bids received'): void {
    const player = this.state.currentPlayer;

    this.updateState({
      status: AuctionStatus.UNSOLD,
      timer: 0,
      leadingTeam: null,
      currentBid: 0,
    });

    this.emit({
      type: AuctionEventType.PLAYER_UNSOLD,
      state: this.state,
      data: {
        player,
        reason,
      },
    });

    this.emit({
      type: AuctionEventType.AUCTION_ENDED,
      state: this.state,
      data: { result: 'UNSOLD' },
    });
  }

  /**
   * Reset auction to IDLE state (for next player)
   */
  reset(): void {
    this.stopTimer();
    this.updateState({
      currentPlayer: null,
      currentBid: 0,
      leadingTeam: null,
      timer: 0,
      status: AuctionStatus.IDLE,
    });
  }

  /**
   * Pause the auction
   */
  pause(): void {
    if (this.state.status === AuctionStatus.BIDDING) {
      this.stopTimer();
      this.updateState({
        status: AuctionStatus.PAUSED,
      });
    }
  }

  /**
   * Resume the auction
   */
  resume(): void {
    if (this.state.status === AuctionStatus.PAUSED) {
      this.updateState({
        status: AuctionStatus.BIDDING,
      });
      this.startTimer();
    }
  }

  /**
   * Get current auction state (read-only)
   */
  getState(): Readonly<AuctionState> {
    return { ...this.state };
  }

  /**
   * Get auction result status
   * Returns 'SOLD' if player was sold, 'UNSOLD' if unsold, or null if auction is still in progress
   */
  getAuctionResult(): 'SOLD' | 'UNSOLD' | null {
    if (this.state.status === AuctionStatus.SOLD) {
      return 'SOLD';
    }
    if (this.state.status === AuctionStatus.UNSOLD) {
      return 'UNSOLD';
    }
    return null;
  }

  /**
   * Get all teams (read-only)
   */
  getTeams(): Readonly<Team[]> {
    return this.teams.map((team) => ({ ...team }));
  }

  /**
   * Get a specific team by ID
   */
  getTeam(teamId: string): Team | undefined {
    return this.teams.find((t) => t.id === teamId);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopTimer();
    this.subscriptions.clear();
  }
}

