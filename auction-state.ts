/**
 * Global Auction State
 * Stores user-selected team and auction type across the application
 */

import { Team } from './types';
import { AuctionType } from './setup';

/**
 * Global auction state
 */
export interface GlobalAuctionState {
  /** Selected auction type (Mega or Mini) */
  auctionType: AuctionType | null;
  /** User-selected team */
  selectedTeam: Team | null;
  /** Selected team ID (for quick reference) */
  selectedTeamId: string | null;
}

/**
 * Global state instance
 */
let globalState: GlobalAuctionState = {
  auctionType: null,
  selectedTeam: null,
  selectedTeamId: null,
};

/**
 * Get current global state
 */
export function getGlobalState(): Readonly<GlobalAuctionState> {
  return { ...globalState };
}

/**
 * Set auction type
 */
export function setAuctionType(type: AuctionType): void {
  globalState.auctionType = type;
}

/**
 * Set selected team
 */
export function setSelectedTeam(team: Team): void {
  globalState.selectedTeam = { ...team };
  globalState.selectedTeamId = team.id;
}

/**
 * Get selected team
 */
export function getSelectedTeam(): Team | null {
  return globalState.selectedTeam ? { ...globalState.selectedTeam } : null;
}

/**
 * Get selected team ID
 */
export function getSelectedTeamId(): string | null {
  return globalState.selectedTeamId;
}

/**
 * Get auction type
 */
export function getAuctionType(): AuctionType | null {
  return globalState.auctionType;
}

/**
 * Reset global state
 */
export function resetGlobalState(): void {
  globalState = {
    auctionType: null,
    selectedTeam: null,
    selectedTeamId: null,
  };
}

