/**
 * IPL Auction Simulator Type Definitions
 */

/**
 * Player roles in cricket
 */
export enum PlayerRole {
  BATSMAN = 'Batsman',
  BOWLER = 'Bowler',
  ALL_ROUNDER = 'All-rounder',
  WICKET_KEEPER = 'Wicket-keeper',
  WICKET_KEEPER_BATSMAN = 'Wicket-keeper Batsman',
}

/**
 * Auction status states
 */
export enum AuctionStatus {
  IDLE = 'idle',
  BIDDING = 'bidding',
  SOLD = 'sold',
  UNSOLD = 'unsold',
  PAUSED = 'paused',
}

/**
 * Player interface representing a cricket player in the auction
 */
export interface Player {
  /** Unique identifier for the player */
  id: string;
  /** Full name of the player */
  name: string;
  /** Primary role of the player */
  role: PlayerRole;
  /** Base price set for the auction (in lakhs/crores) */
  basePrice: number;
  /** Minimum price the player can be sold for */
  minPrice: number;
  /** Maximum price the player can be sold for */
  maxPrice: number;
  /** Player rating (typically 0-100 scale) */
  rating: number;
  /** Popularity index (typically 0-100 scale) */
  popularity: number;
  /** Whether the player is capped (has played for national team) */
  isCapped: boolean;
}

/**
 * Role needs configuration for a team
 */
export interface RoleNeeds {
  [PlayerRole.BATSMAN]?: number;
  [PlayerRole.BOWLER]?: number;
  [PlayerRole.ALL_ROUNDER]?: number;
  [PlayerRole.WICKET_KEEPER]?: number;
  [PlayerRole.WICKET_KEEPER_BATSMAN]?: number;
}

/**
 * Team interface representing a franchise in the auction
 */
export interface Team {
  /** Unique identifier for the team */
  id: string;
  /** Name of the team */
  name: string;
  /** Remaining purse/budget (in lakhs/crores) */
  purse: number;
  /** Current squad of players */
  squad: Player[];
  /** Players retained from previous season */
  retainedPlayers: Player[];
  /** Required number of players for each role */
  roleNeeds: RoleNeeds;
  /** Aggression level in bidding (0-100 scale) */
  aggression: number;
  /** Current count of overseas players in squad */
  overseasCount: number;
}

/**
 * Auction state interface tracking the current auction status
 */
export interface AuctionState {
  /** Currently being auctioned player */
  currentPlayer: Player | null;
  /** Current highest bid amount */
  currentBid: number;
  /** Team currently leading the bid */
  leadingTeam: Team | null;
  /** Timer remaining in seconds */
  timer: number;
  /** Current status of the auction */
  status: AuctionStatus;
}

