import { Player } from './types';

/**
 * Custom error class for retention validation errors
 */
export class RetentionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetentionValidationError';
  }
}

/**
 * Capped player retention cost slabs (in Crores)
 * Applied in order: first capped player costs 18 Cr, second 14 Cr, etc.
 */
const CAPPED_RETENTION_COSTS = [18, 14, 8, 4] as const;

/**
 * Uncapped player retention cost (in Crores)
 */
const UNCAPPED_RETENTION_COST = 4;

/**
 * Maximum allowed retentions
 */
const MAX_TOTAL_RETENTIONS = 6;

/**
 * Maximum allowed capped player retentions
 */
const MAX_CAPPED_RETENTIONS = 4;

/**
 * Maximum allowed uncapped player retentions
 */
const MAX_UNCAPPED_RETENTIONS = 2;

/**
 * Auction type for retention validation
 */
export enum AuctionType {
  MEGA = 'mega',
  MINI = 'mini',
}

/**
 * Validates and calculates the total retention cost for IPL Auction retentions.
 *
 * Mega Auction Rules:
 * - Maximum 6 total retentions
 * - Maximum 4 capped players
 * - Capped retention cost slabs in order: 18, 14, 8, 4 Crores
 * - Uncapped players cost 4 Cr each (maximum 2)
 *
 * Mini Auction Rules:
 * - Unlimited retentions
 * - Same cost structure as Mega Auction
 *
 * @param retainedPlayers - Array of players to be retained
 * @param auctionType - Type of auction (Mega or Mini)
 * @returns Total retention cost in Crores
 * @throws {RetentionValidationError} If any retention rule is violated
 *
 * @example
 * ```typescript
 * const players = [
 *   { id: '1', name: 'Player 1', isCapped: true, ... },
 *   { id: '2', name: 'Player 2', isCapped: false, ... }
 * ];
 * const cost = validateRetentions(players, AuctionType.MEGA);
 * ```
 */
export function validateRetentions(
  retainedPlayers: Player[],
  auctionType: AuctionType = AuctionType.MEGA
): number {
  // Separate capped and uncapped players
  const cappedPlayers = retainedPlayers.filter((player) => player.isCapped);
  const uncappedPlayers = retainedPlayers.filter((player) => !player.isCapped);

  // Apply validation rules based on auction type
  if (auctionType === AuctionType.MEGA) {
    // Validate total retentions for Mega Auction
    if (retainedPlayers.length > MAX_TOTAL_RETENTIONS) {
      throw new RetentionValidationError(
        `Maximum ${MAX_TOTAL_RETENTIONS} retentions allowed in Mega Auction. Found ${retainedPlayers.length} retentions.`
      );
    }

    // Validate capped player count
    if (cappedPlayers.length > MAX_CAPPED_RETENTIONS) {
      throw new RetentionValidationError(
        `Maximum ${MAX_CAPPED_RETENTIONS} capped player retentions allowed in Mega Auction. Found ${cappedPlayers.length} capped players.`
      );
    }

    // Validate uncapped player count
    if (uncappedPlayers.length > MAX_UNCAPPED_RETENTIONS) {
      throw new RetentionValidationError(
        `Maximum ${MAX_UNCAPPED_RETENTIONS} uncapped player retentions allowed in Mega Auction. Found ${uncappedPlayers.length} uncapped players.`
      );
    }
  }
  // Mini Auction: No limits on retentions

  // Calculate total cost
  let totalCost = 0;

  // Calculate capped player costs (apply slabs in order)
  cappedPlayers.forEach((player, index) => {
    if (index < CAPPED_RETENTION_COSTS.length) {
      totalCost += CAPPED_RETENTION_COSTS[index];
    } else {
      // This should not happen due to validation above, but handle edge case
      throw new RetentionValidationError(
        `Invalid capped player retention index: ${index}. Maximum allowed is ${MAX_CAPPED_RETENTIONS}.`
      );
    }
  });

  // Calculate uncapped player costs (4 Cr each)
  totalCost += uncappedPlayers.length * UNCAPPED_RETENTION_COST;

  return totalCost;
}

