import { Player, Team, PlayerRole } from './types';

/**
 * Squad validation result
 */
export interface SquadValidationResult {
  /** Whether the squad is valid */
  isValid: boolean;
  /** Array of validation errors */
  errors: string[];
  /** Array of validation warnings */
  warnings: string[];
}

/**
 * Squad composition breakdown
 */
export interface SquadComposition {
  totalPlayers: number;
  overseasPlayers: number;
  roleCounts: {
    [PlayerRole.BATSMAN]: number;
    [PlayerRole.BOWLER]: number;
    [PlayerRole.ALL_ROUNDER]: number;
    [PlayerRole.WICKET_KEEPER]: number;
    [PlayerRole.WICKET_KEEPER_BATSMAN]: number;
  };
}

/**
 * Minimum role requirements for IPL squad
 */
const MIN_ROLE_REQUIREMENTS = {
  [PlayerRole.BATSMAN]: 6,
  [PlayerRole.BOWLER]: 6,
  [PlayerRole.ALL_ROUNDER]: 2,
  [PlayerRole.WICKET_KEEPER]: 1,
  [PlayerRole.WICKET_KEEPER_BATSMAN]: 0, // Can count towards wicket-keeper requirement
} as const;

/**
 * Maximum squad size
 */
const MAX_SQUAD_SIZE = 25;

/**
 * Maximum overseas players
 */
const MAX_OVERSEAS_PLAYERS = 8;

/**
 * Function type to determine if a player is overseas
 * Default implementation can be provided or custom logic can be used
 */
export type OverseasCheckFunction = (player: Player) => boolean;

/**
 * Default overseas check function
 * This is a placeholder - you may need to implement based on your data
 * For example, check player nationality, name patterns, etc.
 */
export const defaultOverseasCheck: OverseasCheckFunction = (player: Player) => {
  // Placeholder: You can implement based on player data
  // For example, if you have nationality field or can infer from name
  // For now, returns false (assumes all are Indian)
  // You should replace this with actual logic based on your data
  return false;
};

/**
 * Counts players by role in a squad
 */
export function countPlayersByRole(squad: Player[]): SquadComposition['roleCounts'] {
  const counts = {
    [PlayerRole.BATSMAN]: 0,
    [PlayerRole.BOWLER]: 0,
    [PlayerRole.ALL_ROUNDER]: 0,
    [PlayerRole.WICKET_KEEPER]: 0,
    [PlayerRole.WICKET_KEEPER_BATSMAN]: 0,
  };

  squad.forEach((player) => {
    counts[player.role] = (counts[player.role] || 0) + 1;
  });

  return counts;
}

/**
 * Counts overseas players in a squad
 */
export function countOverseasPlayers(
  squad: Player[],
  overseasCheck: OverseasCheckFunction = defaultOverseasCheck
): number {
  return squad.filter((player) => overseasCheck(player)).length;
}

/**
 * Gets squad composition breakdown
 */
export function getSquadComposition(
  squad: Player[],
  overseasCheck: OverseasCheckFunction = defaultOverseasCheck
): SquadComposition {
  return {
    totalPlayers: squad.length,
    overseasPlayers: countOverseasPlayers(squad, overseasCheck),
    roleCounts: countPlayersByRole(squad),
  };
}

/**
 * Checks if a team can add more players
 */
export function canAddPlayer(team: Team): boolean {
  const totalSquadSize = team.squad.length + team.retainedPlayers.length;
  return totalSquadSize < MAX_SQUAD_SIZE;
}

/**
 * Checks if a team can add more overseas players
 */
export function canAddOverseasPlayer(
  team: Team,
  overseasCheck: OverseasCheckFunction = defaultOverseasCheck
): boolean {
  const allPlayers = [...team.squad, ...team.retainedPlayers];
  const overseasCount = countOverseasPlayers(allPlayers, overseasCheck);
  return overseasCount < MAX_OVERSEAS_PLAYERS;
}

/**
 * Checks if a team needs a specific role
 */
export function needsRole(
  team: Team,
  role: PlayerRole
): { needs: boolean; current: number; required: number } {
  const allPlayers = [...team.squad, ...team.retainedPlayers];
  const roleCounts = countPlayersByRole(allPlayers);

  // Wicket-keeper batsman counts towards wicket-keeper requirement
  let current = roleCounts[role] || 0;
  if (role === PlayerRole.WICKET_KEEPER) {
    current += roleCounts[PlayerRole.WICKET_KEEPER_BATSMAN] || 0;
  }

  const required = MIN_ROLE_REQUIREMENTS[role] || 0;

  return {
    needs: current < required,
    current,
    required,
  };
}

/**
 * Checks if a team needs a specific player role (for bidding decisions)
 */
export function teamNeedsRole(team: Team, role: PlayerRole): boolean {
  return needsRole(team, role).needs;
}

/**
 * Gets remaining slots for a specific role
 */
export function getRemainingRoleSlots(team: Team, role: PlayerRole): number {
  const { current, required } = needsRole(team, role);
  return Math.max(0, required - current);
}

/**
 * Validates a team's squad against IPL rules
 */
export function validateSquad(
  team: Team,
  overseasCheck: OverseasCheckFunction = defaultOverseasCheck
): SquadValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const allPlayers = [...team.squad, ...team.retainedPlayers];
  const composition = getSquadComposition(allPlayers, overseasCheck);

  // Check squad size
  if (composition.totalPlayers > MAX_SQUAD_SIZE) {
    errors.push(
      `Squad size (${composition.totalPlayers}) exceeds maximum (${MAX_SQUAD_SIZE})`
    );
  }

  // Check overseas players
  if (composition.overseasPlayers > MAX_OVERSEAS_PLAYERS) {
    errors.push(
      `Overseas players (${composition.overseasPlayers}) exceed maximum (${MAX_OVERSEAS_PLAYERS})`
    );
  }

  // Check role requirements
  const batsmenCount =
    composition.roleCounts[PlayerRole.BATSMAN] +
    composition.roleCounts[PlayerRole.WICKET_KEEPER_BATSMAN];
  if (batsmenCount < MIN_ROLE_REQUIREMENTS[PlayerRole.BATSMAN]) {
    errors.push(
      `Insufficient batsmen: ${batsmenCount} (minimum ${MIN_ROLE_REQUIREMENTS[PlayerRole.BATSMAN]} required)`
    );
  }

  const bowlersCount = composition.roleCounts[PlayerRole.BOWLER];
  if (bowlersCount < MIN_ROLE_REQUIREMENTS[PlayerRole.BOWLER]) {
    errors.push(
      `Insufficient bowlers: ${bowlersCount} (minimum ${MIN_ROLE_REQUIREMENTS[PlayerRole.BOWLER]} required)`
    );
  }

  const allRoundersCount = composition.roleCounts[PlayerRole.ALL_ROUNDER];
  if (allRoundersCount < MIN_ROLE_REQUIREMENTS[PlayerRole.ALL_ROUNDER]) {
    errors.push(
      `Insufficient all-rounders: ${allRoundersCount} (minimum ${MIN_ROLE_REQUIREMENTS[PlayerRole.ALL_ROUNDER]} required)`
    );
  }

  const wicketKeepersCount =
    composition.roleCounts[PlayerRole.WICKET_KEEPER] +
    composition.roleCounts[PlayerRole.WICKET_KEEPER_BATSMAN];
  if (wicketKeepersCount < MIN_ROLE_REQUIREMENTS[PlayerRole.WICKET_KEEPER]) {
    errors.push(
      `Insufficient wicket-keepers: ${wicketKeepersCount} (minimum ${MIN_ROLE_REQUIREMENTS[PlayerRole.WICKET_KEEPER]} required)`
    );
  }

  // Warnings for approaching limits
  if (composition.totalPlayers >= MAX_SQUAD_SIZE - 2) {
    warnings.push(
      `Squad size (${composition.totalPlayers}) is close to maximum (${MAX_SQUAD_SIZE})`
    );
  }

  if (composition.overseasPlayers >= MAX_OVERSEAS_PLAYERS - 1) {
    warnings.push(
      `Overseas players (${composition.overseasPlayers}) is close to maximum (${MAX_OVERSEAS_PLAYERS})`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Checks if a team can bid on a player (considering squad constraints)
 */
export function canBidOnPlayer(
  team: Team,
  player: Player,
  overseasCheck: OverseasCheckFunction = defaultOverseasCheck
): { canBid: boolean; reason?: string } {
  // Check if squad is full
  if (!canAddPlayer(team)) {
    return {
      canBid: false,
      reason: `Squad is full (${team.squad.length + team.retainedPlayers.length}/${MAX_SQUAD_SIZE})`,
    };
  }

  // Check if overseas limit is reached
  if (overseasCheck(player) && !canAddOverseasPlayer(team, overseasCheck)) {
    return {
      canBid: false,
      reason: `Overseas player limit reached (${MAX_OVERSEAS_PLAYERS})`,
    };
  }

  return { canBid: true };
}

/**
 * Gets remaining squad slots
 */
export function getRemainingSquadSlots(team: Team): number {
  const totalSquadSize = team.squad.length + team.retainedPlayers.length;
  return Math.max(0, MAX_SQUAD_SIZE - totalSquadSize);
}

/**
 * Gets remaining overseas slots
 */
export function getRemainingOverseasSlots(
  team: Team,
  overseasCheck: OverseasCheckFunction = defaultOverseasCheck
): number {
  const allPlayers = [...team.squad, ...team.retainedPlayers];
  const overseasCount = countOverseasPlayers(allPlayers, overseasCheck);
  return Math.max(0, MAX_OVERSEAS_PLAYERS - overseasCount);
}

/**
 * Gets a summary of squad status for bidding decisions
 */
export function getSquadStatus(
  team: Team,
  overseasCheck: OverseasCheckFunction = defaultOverseasCheck
): {
  canAddMore: boolean;
  remainingSlots: number;
  remainingOverseasSlots: number;
  roleNeeds: {
    [key in PlayerRole]: { needs: boolean; current: number; required: number; remaining: number };
  };
} {
  const remainingSlots = getRemainingSquadSlots(team);
  const remainingOverseasSlots = getRemainingOverseasSlots(team, overseasCheck);

  const roleNeeds = {
    [PlayerRole.BATSMAN]: {
      ...needsRole(team, PlayerRole.BATSMAN),
      remaining: getRemainingRoleSlots(team, PlayerRole.BATSMAN),
    },
    [PlayerRole.BOWLER]: {
      ...needsRole(team, PlayerRole.BOWLER),
      remaining: getRemainingRoleSlots(team, PlayerRole.BOWLER),
    },
    [PlayerRole.ALL_ROUNDER]: {
      ...needsRole(team, PlayerRole.ALL_ROUNDER),
      remaining: getRemainingRoleSlots(team, PlayerRole.ALL_ROUNDER),
    },
    [PlayerRole.WICKET_KEEPER]: {
      ...needsRole(team, PlayerRole.WICKET_KEEPER),
      remaining: getRemainingRoleSlots(team, PlayerRole.WICKET_KEEPER),
    },
    [PlayerRole.WICKET_KEEPER_BATSMAN]: {
      ...needsRole(team, PlayerRole.WICKET_KEEPER_BATSMAN),
      remaining: getRemainingRoleSlots(team, PlayerRole.WICKET_KEEPER_BATSMAN),
    },
  };

  return {
    canAddMore: remainingSlots > 0,
    remainingSlots,
    remainingOverseasSlots,
    roleNeeds,
  };
}

