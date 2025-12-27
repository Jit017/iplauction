import { Player, Team } from './types';

/**
 * Result of duplicate check
 */
export interface DuplicateCheckResult {
  /** Whether the player is a duplicate */
  isDuplicate: boolean;
  /** Reason if duplicate */
  reason?: string;
  /** Where the duplicate was found */
  location?: 'squad' | 'retained' | 'auctioned';
}

/**
 * Get all retained player IDs across all teams
 */
export function getRetainedPlayerIds(teams: Team[]): Set<string> {
  const retainedIds = new Set<string>();
  teams.forEach((team) => {
    team.retainedPlayers.forEach((player) => {
      retainedIds.add(player.id);
    });
  });
  return retainedIds;
}

/**
 * Get all players currently in squads across all teams
 */
export function getSquadPlayerIds(teams: Team[]): Set<string> {
  const squadIds = new Set<string>();
  teams.forEach((team) => {
    team.squad.forEach((player) => {
      squadIds.add(player.id);
    });
  });
  return squadIds;
}

/**
 * Get all player IDs that are either retained or in squads
 */
export function getUnavailablePlayerIds(teams: Team[]): Set<string> {
  const unavailableIds = new Set<string>();
  teams.forEach((team) => {
    // Add retained players
    team.retainedPlayers.forEach((player) => {
      unavailableIds.add(player.id);
    });
    // Add squad players
    team.squad.forEach((player) => {
      unavailableIds.add(player.id);
    });
  });
  return unavailableIds;
}

/**
 * Check if a player is retained by any team
 */
export function isPlayerRetained(player: Player, teams: Team[]): boolean {
  const retainedIds = getRetainedPlayerIds(teams);
  return retainedIds.has(player.id);
}

/**
 * Check if a player is already in any team's squad
 */
export function isPlayerInSquad(player: Player, teams: Team[]): boolean {
  const squadIds = getSquadPlayerIds(teams);
  return squadIds.has(player.id);
}

/**
 * Check if a player is available for auction (not retained and not in squad)
 */
export function isPlayerAvailableForAuction(
  player: Player,
  teams: Team[]
): boolean {
  return !isPlayerRetained(player, teams) && !isPlayerInSquad(player, teams);
}

/**
 * Filter players to return only those available for auction
 * Excludes players that are retained or already in squads
 *
 * @param players - All players
 * @param teams - All teams
 * @returns Array of players available for auction
 */
export function getAuctionablePlayers(
  players: Player[],
  teams: Team[]
): Player[] {
  const unavailableIds = getUnavailablePlayerIds(teams);
  return players.filter((player) => !unavailableIds.has(player.id));
}

/**
 * Check if a player is a duplicate (already in squad or retained)
 *
 * @param player - Player to check
 * @param teams - All teams
 * @param auctionedPlayers - Optional set of already auctioned player IDs
 * @returns DuplicateCheckResult
 */
export function checkForDuplicate(
  player: Player,
  teams: Team[],
  auctionedPlayers?: Set<string>
): DuplicateCheckResult {
  // Check if already retained
  if (isPlayerRetained(player, teams)) {
    const retainingTeam = teams.find((team) =>
      team.retainedPlayers.some((p) => p.id === player.id)
    );
    return {
      isDuplicate: true,
      reason: `Player "${player.name}" is already retained by ${retainingTeam?.name || 'a team'}`,
      location: 'retained',
    };
  }

  // Check if already in squad
  if (isPlayerInSquad(player, teams)) {
    const owningTeam = teams.find((team) =>
      team.squad.some((p) => p.id === player.id)
    );
    return {
      isDuplicate: true,
      reason: `Player "${player.name}" is already in ${owningTeam?.name || 'a team'}'s squad`,
      location: 'squad',
    };
  }

  // Check if already auctioned (if tracking)
  if (auctionedPlayers && auctionedPlayers.has(player.id)) {
    return {
      isDuplicate: true,
      reason: `Player "${player.name}" has already been auctioned`,
      location: 'auctioned',
    };
  }

  return {
    isDuplicate: false,
  };
}

/**
 * Validate that a player can be auctioned
 * Throws an error if the player is a duplicate
 *
 * @param player - Player to validate
 * @param teams - All teams
 * @param auctionedPlayers - Optional set of already auctioned player IDs
 * @throws {Error} If player is a duplicate
 */
export function validatePlayerForAuction(
  player: Player,
  teams: Team[],
  auctionedPlayers?: Set<string>
): void {
  const duplicateCheck = checkForDuplicate(player, teams, auctionedPlayers);
  if (duplicateCheck.isDuplicate) {
    throw new Error(duplicateCheck.reason || 'Player is a duplicate');
  }
}

/**
 * Get statistics about the auction pool
 */
export interface AuctionPoolStats {
  totalPlayers: number;
  retainedPlayers: number;
  squadPlayers: number;
  auctionablePlayers: number;
  unavailablePlayers: number;
}

/**
 * Get statistics about the auction pool
 *
 * @param players - All players
 * @param teams - All teams
 * @returns AuctionPoolStats
 */
export function getAuctionPoolStats(
  players: Player[],
  teams: Team[]
): AuctionPoolStats {
  const retainedIds = getRetainedPlayerIds(teams);
  const squadIds = getSquadPlayerIds(teams);
  const unavailableIds = getUnavailablePlayerIds(teams);

  const auctionable = players.filter(
    (player) => !unavailableIds.has(player.id)
  );

  return {
    totalPlayers: players.length,
    retainedPlayers: retainedIds.size,
    squadPlayers: squadIds.size,
    auctionablePlayers: auctionable.length,
    unavailablePlayers: unavailableIds.size,
  };
}

/**
 * Find which team retains a player
 *
 * @param player - Player to find
 * @param teams - All teams
 * @returns Team that retains the player, or undefined
 */
export function findRetainingTeam(
  player: Player,
  teams: Team[]
): Team | undefined {
  return teams.find((team) =>
    team.retainedPlayers.some((p) => p.id === player.id)
  );
}

/**
 * Find which team has a player in their squad
 *
 * @param player - Player to find
 * @param teams - All teams
 * @returns Team that has the player, or undefined
 */
export function findOwningTeam(player: Player, teams: Team[]): Team | undefined {
  return teams.find((team) => team.squad.some((p) => p.id === player.id));
}

/**
 * Get all retained players across all teams
 *
 * @param teams - All teams
 * @returns Array of all retained players
 */
export function getAllRetainedPlayers(teams: Team[]): Player[] {
  const retainedPlayers: Player[] = [];
  teams.forEach((team) => {
    retainedPlayers.push(...team.retainedPlayers);
  });
  return retainedPlayers;
}

/**
 * Get all squad players across all teams
 *
 * @param teams - All teams
 * @returns Array of all squad players
 */
export function getAllSquadPlayers(teams: Team[]): Player[] {
  const squadPlayers: Player[] = [];
  teams.forEach((team) => {
    squadPlayers.push(...team.squad);
  });
  return squadPlayers;
}

