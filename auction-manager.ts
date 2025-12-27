import { AuctionEngine, AuctionEvent, AuctionEventType } from './auction-engine';
import { Player, Team, AuctionStatus } from './types';
import {
  getAuctionablePlayers,
  checkForDuplicate,
  validatePlayerForAuction,
  isPlayerAvailableForAuction,
  isPlayerRetained,
  getAuctionPoolStats,
} from './auction-pool';

/**
 * Configuration for the auction manager
 */
export interface AuctionManagerConfig {
  /** Whether to automatically proceed to next player after auction ends */
  autoProceed?: boolean;
  /** Delay in milliseconds before proceeding to next player */
  proceedDelay?: number;
}

/**
 * Auction manager statistics
 */
export interface AuctionStats {
  totalPlayers: number;
  playersAuctioned: number;
  playersSold: number;
  playersUnsold: number;
  playersSkipped: number;
  totalRevenue: number;
}

/**
 * Auction Manager
 *
 * Orchestrates the auction process by:
 * - Loading players from the dataset
 * - Iterating through players sequentially
 * - Skipping retained players
 * - Managing auction state transitions
 * - Tracking auction statistics
 */
export class AuctionManager {
  private engine: AuctionEngine;
  private players: Player[];
  private auctionablePlayers: Player[];
  private currentPlayerIndex: number = 0;
  private config: Required<AuctionManagerConfig>;
  private stats: AuctionStats;
  private isRunning: boolean = false;
  private subscriptions: Set<(event: AuctionEvent) => void> = new Set();
  private auctionedPlayerIds: Set<string> = new Set();

  /**
   * Creates a new auction manager
   *
   * @param engine - Auction engine instance
   * @param players - Array of players to auction
   * @param config - Optional configuration
   */
  constructor(
    engine: AuctionEngine,
    players: Player[],
    config: AuctionManagerConfig = {}
  ) {
    this.engine = engine;
    this.players = [...players]; // Create a copy
    
    // Filter out retained players and get auctionable players
    this.refreshAuctionablePlayers();
    
    this.config = {
      autoProceed: config.autoProceed ?? false,
      proceedDelay: config.proceedDelay ?? 1000,
    };
    this.stats = {
      totalPlayers: this.players.length,
      playersAuctioned: 0,
      playersSold: 0,
      playersUnsold: 0,
      playersSkipped: this.players.length - this.auctionablePlayers.length,
      totalRevenue: 0,
    };

    // Subscribe to engine events
    this.engine.subscribe((event) => {
      this.handleEngineEvent(event);
    });
  }

  /**
   * Subscribe to auction manager events
   */
  subscribe(callback: (event: AuctionEvent) => void): () => void {
    this.subscriptions.add(callback);
    return () => {
      this.subscriptions.delete(callback);
    };
  }

  /**
   * Emit event to subscribers
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
   * Handle events from the auction engine
   */
  private handleEngineEvent(event: AuctionEvent): void {
    // Forward all engine events
    this.emit(event);

    // Handle auction end events
    if (event.type === AuctionEventType.AUCTION_ENDED) {
      this.handleAuctionEnded(event);
    }
  }

  /**
   * Handle auction ended event
   */
  private handleAuctionEnded(event: AuctionEvent): void {
    const result = event.data?.result as 'SOLD' | 'UNSOLD' | undefined;
    const bidAmount = event.data?.bidAmount || 0;

    if (result === 'SOLD') {
      this.stats.playersSold++;
      this.stats.totalRevenue += bidAmount;
    } else if (result === 'UNSOLD') {
      this.stats.playersUnsold++;
    }

    // Auto-proceed to next player (both SOLD and UNSOLD cases)
    if (this.config.autoProceed && this.isRunning) {
      setTimeout(() => {
        this.proceedToNextPlayer();
      }, this.config.proceedDelay);
    }
  }

  /**
   * Refresh auctionable players list (excludes retained players)
   */
  private refreshAuctionablePlayers(): void {
    const teams = this.engine.getTeams();
    this.auctionablePlayers = getAuctionablePlayers(this.players, teams);
  }

  /**
   * Get the next available player (not retained, not already auctioned)
   */
  private getNextAvailablePlayer(): Player | null {
    // Refresh auctionable players to ensure we have the latest list
    this.refreshAuctionablePlayers();
    
    const teams = this.engine.getTeams();
    
    while (this.currentPlayerIndex < this.auctionablePlayers.length) {
      const player = this.auctionablePlayers[this.currentPlayerIndex];
      this.currentPlayerIndex++;

      // Explicit check: Player must not be retained
      if (isPlayerRetained(player, teams)) {
        this.stats.playersSkipped++;
        this.emit({
          type: AuctionEventType.PLAYER_SET,
          state: this.engine.getState(),
          data: {
            player,
            skipped: true,
            reason: `Player "${player.name}" is retained and cannot be auctioned`,
          },
        });
        continue;
      }

      // Validate player is still available (double-check)
      if (!isPlayerAvailableForAuction(player, teams)) {
        this.stats.playersSkipped++;
        this.emit({
          type: AuctionEventType.PLAYER_SET,
          state: this.engine.getState(),
          data: {
            player,
            skipped: true,
            reason: 'Player is no longer available for auction',
          },
        });
        continue;
      }

      // Check for duplicates (should not happen, but validate)
      const duplicateCheck = checkForDuplicate(
        player,
        teams,
        this.auctionedPlayerIds
      );
      if (duplicateCheck.isDuplicate) {
        this.stats.playersSkipped++;
        this.emit({
          type: AuctionEventType.PLAYER_SET,
          state: this.engine.getState(),
          data: {
            player,
            skipped: true,
            reason: duplicateCheck.reason || 'Duplicate player',
          },
        });
        continue;
      }

      return player;
    }

    return null;
  }

  /**
   * Start auctioning the next player
   */
  private startNextPlayer(): void {
    // Ensure auction is in IDLE state
    const state = this.engine.getState();
    if (state.status !== AuctionStatus.IDLE) {
      this.engine.reset();
    }

    const player = this.getNextAvailablePlayer();

    if (!player) {
      // No more players
      this.isRunning = false;
      this.emit({
        type: AuctionEventType.AUCTION_ENDED,
        state: this.engine.getState(),
        data: {
          result: 'COMPLETE',
          stats: this.getStats(),
        },
      });
      return;
    }

    try {
      // Validate player before setting (double-check retained status)
      const teams = this.engine.getTeams();
      
      // Explicit check for retained players - CRITICAL: Never auction retained players
      if (isPlayerRetained(player, teams)) {
        const retainingTeam = teams.find(t => 
          t.retainedPlayers.some(p => p.id === player.id)
        );
        this.stats.playersSkipped++;
        this.emit({
          type: AuctionEventType.ERROR,
          state: this.engine.getState(),
          error: `CRITICAL: Player "${player.name}" is retained by ${retainingTeam?.name || 'a team'} and cannot be auctioned. Skipping.`,
        });
        // Continue to next player
        setTimeout(() => this.startNextPlayer(), 100);
        return;
      }
      
      // Additional validation - double check player is not in any squad
      if (!isPlayerAvailableForAuction(player, teams)) {
        this.stats.playersSkipped++;
        this.emit({
          type: AuctionEventType.ERROR,
          state: this.engine.getState(),
          error: `Player "${player.name}" is not available for auction (retained or in squad). Skipping.`,
        });
        setTimeout(() => this.startNextPlayer(), 100);
        return;
      }
      
      // Final validation
      validatePlayerForAuction(player, teams, this.auctionedPlayerIds);
      
      this.engine.setCurrentPlayer(player);
      this.stats.playersAuctioned++;
      this.auctionedPlayerIds.add(player.id);
    } catch (error: any) {
      console.error('Error setting current player:', error);
      // Mark as skipped and continue
      this.stats.playersSkipped++;
      this.emit({
        type: AuctionEventType.ERROR,
        state: this.engine.getState(),
        error: error.message || 'Failed to set current player',
      });
      // Try to reset and continue
      this.engine.reset();
      setTimeout(() => this.startNextPlayer(), 100);
    }
  }

  /**
   * Proceed to the next player
   * Resets auction state and starts next player auction
   */
  proceedToNextPlayer(): void {
    if (!this.isRunning) {
      return;
    }

    // Reset auction state
    this.engine.reset();

    // Start next player
    this.startNextPlayer();
  }

  /**
   * Start the auction process
   * Begins auctioning players sequentially
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Auction is already running');
      return;
    }

    this.isRunning = true;
    this.currentPlayerIndex = 0;

    this.emit({
      type: AuctionEventType.STATE_CHANGED,
      state: this.engine.getState(),
      data: {
        action: 'Auction started',
        totalPlayers: this.stats.totalPlayers,
      },
    });

    // Start with first player
    this.startNextPlayer();
  }

  /**
   * Stop the auction process
   */
  stop(): void {
    this.isRunning = false;
    this.engine.pause();

    this.emit({
      type: AuctionEventType.STATE_CHANGED,
      state: this.engine.getState(),
      data: {
        action: 'Auction stopped',
      },
    });
  }

  /**
   * Pause the current auction
   */
  pause(): void {
    this.engine.pause();
  }

  /**
   * Resume the current auction
   */
  resume(): void {
    this.engine.resume();
  }

  /**
   * Get current auction statistics
   */
  getStats(): Readonly<AuctionStats> {
    return { ...this.stats };
  }

  /**
   * Get remaining players count
   */
  getRemainingPlayersCount(): number {
    return this.auctionablePlayers.length - this.currentPlayerIndex;
  }

  /**
   * Get auctionable players (excluding retained players)
   */
  getAuctionablePlayers(): Readonly<Player[]> {
    return [...this.auctionablePlayers];
  }

  /**
   * Get auction pool statistics
   */
  getAuctionPoolStats() {
    const teams = this.engine.getTeams();
    return getAuctionPoolStats(this.players, teams);
  }

  /**
   * Get current player index
   */
  getCurrentPlayerIndex(): number {
    return this.currentPlayerIndex;
  }

  /**
   * Check if auction is running
   */
  isAuctionRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get the auction engine instance
   */
  getEngine(): AuctionEngine {
    return this.engine;
  }

  /**
   * Reset auction manager state
   */
  reset(): void {
    this.isRunning = false;
    this.currentPlayerIndex = 0;
    this.auctionedPlayerIds.clear();
    
    // Recalculate auctionable players (in case teams changed, e.g., retentions)
    this.refreshAuctionablePlayers();
    
    this.stats = {
      totalPlayers: this.players.length,
      playersAuctioned: 0,
      playersSold: 0,
      playersUnsold: 0,
      playersSkipped: this.players.length - this.auctionablePlayers.length,
      totalRevenue: 0,
    };
    this.engine.reset();
  }
}

/**
 * Helper function to load players from players.ts
 * This function can be used to dynamically load players
 */
export async function loadPlayers(): Promise<Player[]> {
  try {
    // Dynamic import of players
    const playersModule = await import('./players');
    return playersModule.players;
  } catch (error) {
    console.error('Error loading players:', error);
    throw new Error(
      'Failed to load players. Make sure players.ts exists and was generated correctly. Run: npm run convert'
    );
  }
}

/**
 * Synchronous helper function to load players from players.ts
 * Use this when players are already available in the module scope
 */
export function loadPlayersSync(): Player[] {
  try {
    // Try to require/import synchronously
    // Note: This works in Node.js with CommonJS
    const playersModule = require('./players');
    return playersModule.players;
  } catch (error) {
    console.error('Error loading players:', error);
    throw new Error(
      'Failed to load players. Make sure players.ts exists and was generated correctly. Run: npm run convert'
    );
  }
}

/**
 * Create an auction manager with players loaded from players.ts
 *
 * @param engine - Auction engine instance
 * @param config - Optional configuration
 * @returns Promise resolving to AuctionManager instance
 */
export async function createAuctionManager(
  engine: AuctionEngine,
  config: AuctionManagerConfig = {}
): Promise<AuctionManager> {
  const players = await loadPlayers();
  return new AuctionManager(engine, players, config);
}

/**
 * Create an auction manager with players (synchronous)
 * Use this when you already have players loaded
 *
 * @param engine - Auction engine instance
 * @param players - Array of players to auction
 * @param config - Optional configuration
 * @returns AuctionManager instance
 */
export function createAuctionManagerSync(
  engine: AuctionEngine,
  players: Player[],
  config: AuctionManagerConfig = {}
): AuctionManager {
  return new AuctionManager(engine, players, config);
}

