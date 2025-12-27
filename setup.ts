import { Player, Team } from './types';
import { validateRetentions, RetentionValidationError, AuctionType as RetentionAuctionType } from './retention';
import { getPreviousSeasonSquad } from './previous-season-squads';
import { defaultOverseasCheck } from './squad-validator';

/**
 * Auction type
 */
export enum AuctionType {
  MEGA = 'mega',
  MINI = 'mini',
}

/**
 * Setup state
 */
export interface SetupState {
  auctionType: AuctionType;
  selectedTeam: Team | null;
  previousSquad: Player[];
  retainedPlayers: Player[];
  retentionCost: number;
  remainingPurse: number;
}

/**
 * Pre-Auction Setup Manager
 */
export class SetupManager {
  private state: SetupState;
  private teams: Team[];
  private onComplete: (state: SetupState) => void;

  constructor(
    teams: Team[],
    onComplete: (state: SetupState) => void
  ) {
    this.teams = teams;
    this.onComplete = onComplete;
    this.state = {
      auctionType: AuctionType.MEGA,
      selectedTeam: null,
      previousSquad: [],
      retainedPlayers: [],
      retentionCost: 0,
      remainingPurse: 100, // Default purse
    };
  }

  /**
   * Get current setup state
   */
  getState(): Readonly<SetupState> {
    return { ...this.state };
  }

  /**
   * Set auction type
   */
  setAuctionType(type: AuctionType): void {
    this.state.auctionType = type;
    this.updateRetentionCost();
  }

  /**
   * Set selected team
   */
  setSelectedTeam(teamId: string): void {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    this.state.selectedTeam = team;
    // Load previous season squad from data file
    this.state.previousSquad = getPreviousSeasonSquad(teamId);
    this.state.retainedPlayers = [];
    this.state.remainingPurse = team.purse;
    this.updateRetentionCost();
  }

  /**
   * Toggle player retention
   */
  toggleRetention(playerId: string): { success: boolean; error?: string } {
    const player = this.state.previousSquad.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, error: 'Player not found in squad' };
    }

    const isRetained = this.state.retainedPlayers.some((p) => p.id === playerId);

    if (isRetained) {
      // Remove from retained
      this.state.retainedPlayers = this.state.retainedPlayers.filter(
        (p) => p.id !== playerId
      );
    } else {
      // Add to retained (will be validated)
      this.state.retainedPlayers.push(player);
    }

    this.updateRetentionCost();
    return { success: true };
  }

  /**
   * Update retention cost and remaining purse
   */
  private updateRetentionCost(): void {
    try {
      // Convert AuctionType enum to RetentionAuctionType
      const retentionAuctionType = this.state.auctionType === AuctionType.MEGA 
        ? RetentionAuctionType.MEGA 
        : RetentionAuctionType.MINI;
      
      this.state.retentionCost = validateRetentions(
        this.state.retainedPlayers,
        retentionAuctionType
      );
      const basePurse = this.state.selectedTeam?.purse || 100;
      this.state.remainingPurse = basePurse - this.state.retentionCost;
    } catch (error) {
      // If validation fails, calculate cost anyway for display
      // but it will be marked as invalid
      const capped = this.state.retainedPlayers.filter((p) => p.isCapped);
      const uncapped = this.state.retainedPlayers.filter((p) => !p.isCapped);
      const cappedCost = capped.reduce((sum, _, index) => {
        const costs = [18, 14, 8, 4];
        return sum + (costs[index] || 0);
      }, 0);
      const uncappedCost = uncapped.length * 4;
      this.state.retentionCost = cappedCost + uncappedCost;
      const basePurse = this.state.selectedTeam?.purse || 100;
      this.state.remainingPurse = basePurse - this.state.retentionCost;
    }
  }

  /**
   * Get retention validation error if any
   */
  getRetentionError(): string | null {
    try {
      const retentionAuctionType = this.state.auctionType === AuctionType.MEGA 
        ? RetentionAuctionType.MEGA 
        : RetentionAuctionType.MINI;
      validateRetentions(this.state.retainedPlayers, retentionAuctionType);
      return null;
    } catch (error) {
      if (error instanceof RetentionValidationError) {
        return error.message;
      }
      return 'Unknown validation error';
    }
  }

  /**
   * Check if setup is complete and valid
   */
  isSetupComplete(): boolean {
    if (!this.state.selectedTeam) return false;
    if (this.getRetentionError()) return false;
    return true;
  }

  /**
   * Complete setup and proceed to auction
   */
  completeSetup(): void {
    if (!this.isSetupComplete()) {
      throw new Error('Setup is not complete or invalid');
    }

    // Update team with retained players
    if (this.state.selectedTeam) {
      // Add retained players to both retainedPlayers array AND squad
      // Retained players are part of the squad from the start
      this.state.selectedTeam.retainedPlayers = [...this.state.retainedPlayers];
      this.state.selectedTeam.squad = [...this.state.retainedPlayers];
      
      // Deduct retention cost from purse
      this.state.selectedTeam.purse = this.state.remainingPurse;
      
      // Update overseas count for retained players
      this.state.selectedTeam.overseasCount = this.state.retainedPlayers.filter(
        (player) => defaultOverseasCheck(player)
      ).length;
    }

    this.onComplete(this.state);
  }

  /**
   * Get retention cost breakdown
   */
  getRetentionBreakdown(): {
    capped: { players: Player[]; cost: number };
    uncapped: { players: Player[]; cost: number };
    total: number;
  } {
    const capped = this.state.retainedPlayers.filter((p) => p.isCapped);
    const uncapped = this.state.retainedPlayers.filter((p) => !p.isCapped);

    const cappedCost = capped.reduce((sum, _, index) => {
      const costs = [18, 14, 8, 4];
      return sum + (costs[index] || 0);
    }, 0);

    const uncappedCost = uncapped.length * 4;

    return {
      capped: { players: capped, cost: cappedCost },
      uncapped: { players: uncapped, cost: uncappedCost },
      total: cappedCost + uncappedCost,
    };
  }
}

