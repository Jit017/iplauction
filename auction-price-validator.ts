import { Player } from './types';

/**
 * Result of price validation for an auction
 */
export interface PriceValidationResult {
  /** Whether the auction can end (bid is valid and timer expired) */
  canEnd: boolean;
  /** Whether the auction must be extended (bid below minPrice when timer ends) */
  mustExtend: boolean;
  /** Whether the current bid is valid (within minPrice and maxPrice) */
  isValid: boolean;
  /** Error message if bid is invalid */
  error?: string;
}

/**
 * Custom error class for price validation errors
 */
export class PriceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PriceValidationError';
  }
}

/**
 * Validates and enforces realistic IPL auction prices.
 *
 * Rules:
 * - Player cannot be sold below minPrice
 * - Player cannot exceed maxPrice
 * - If auction timer ends below minPrice, auction must continue
 *
 * @param currentBid - Current highest bid amount
 * @param player - Player being auctioned
 * @param timerExpired - Whether the auction timer has expired
 * @returns PriceValidationResult indicating if auction can end, must extend, or has errors
 *
 * @example
 * ```typescript
 * const player = { minPrice: 50, maxPrice: 200, ... };
 * const result = validateAuctionPrice(75, player, false);
 * if (result.canEnd) {
 *   // Proceed with selling player
 * } else if (result.mustExtend) {
 *   // Extend timer and continue auction
 * }
 * ```
 */
export function validateAuctionPrice(
  currentBid: number,
  player: Player,
  timerExpired: boolean
): PriceValidationResult {
  // Validate bid is not below minimum price
  if (currentBid < player.minPrice) {
    // If timer expired but bid is below minPrice, auction must continue
    if (timerExpired) {
      return {
        canEnd: false,
        mustExtend: true,
        isValid: false,
        error: `Bid (${currentBid}) is below minimum price (${player.minPrice}). Auction must continue.`,
      };
    }
    // Timer hasn't expired yet, but bid is invalid
    return {
      canEnd: false,
      mustExtend: false,
      isValid: false,
      error: `Bid (${currentBid}) cannot be below minimum price (${player.minPrice}).`,
    };
  }

  // Validate bid does not exceed maximum price
  if (currentBid > player.maxPrice) {
    return {
      canEnd: false,
      mustExtend: false,
      isValid: false,
      error: `Bid (${currentBid}) cannot exceed maximum price (${player.maxPrice}).`,
    };
  }

  // Bid is within valid range
  // If timer expired and bid is valid, auction can end
  if (timerExpired) {
    return {
      canEnd: true,
      mustExtend: false,
      isValid: true,
    };
  }

  // Timer hasn't expired, bid is valid, auction continues normally
  return {
    canEnd: false,
    mustExtend: false,
    isValid: true,
  };
}

/**
 * Validates a bid amount against player price constraints.
 * Throws an error if the bid is invalid (for immediate validation).
 *
 * @param bid - Bid amount to validate
 * @param player - Player being auctioned
 * @throws {PriceValidationError} If bid is below minPrice or above maxPrice
 *
 * @example
 * ```typescript
 * try {
 *   validateBidAmount(75, player);
 *   // Bid is valid, proceed
 * } catch (error) {
 *   // Handle invalid bid
 * }
 * ```
 */
export function validateBidAmount(bid: number, player: Player): void {
  if (bid < player.minPrice) {
    throw new PriceValidationError(
      `Bid amount ${bid} is below minimum price ${player.minPrice}`
    );
  }
  if (bid > player.maxPrice) {
    throw new PriceValidationError(
      `Bid amount ${bid} exceeds maximum price ${player.maxPrice}`
    );
  }
}

/**
 * Determines if an auction can conclude based on current state.
 * Designed for use in a live auction loop.
 *
 * @param currentBid - Current highest bid amount
 * @param player - Player being auctioned
 * @param timerExpired - Whether the auction timer has expired
 * @returns true if auction can end, false if it must continue
 *
 * @example
 * ```typescript
 * // In auction loop
 * if (timer <= 0) {
 *   const canEnd = canAuctionEnd(currentBid, currentPlayer, true);
 *   if (canEnd) {
 *     sellPlayer(currentPlayer, currentBid, leadingTeam);
 *   } else {
 *     extendTimer(); // Continue auction
 *   }
 * }
 * ```
 */
export function canAuctionEnd(
  currentBid: number,
  player: Player,
  timerExpired: boolean
): boolean {
  const result = validateAuctionPrice(currentBid, player, timerExpired);
  return result.canEnd;
}

/**
 * Checks if auction must be extended (timer expired but bid below minPrice).
 * Designed for use in a live auction loop.
 *
 * @param currentBid - Current highest bid amount
 * @param player - Player being auctioned
 * @param timerExpired - Whether the auction timer has expired
 * @returns true if auction must be extended
 *
 * @example
 * ```typescript
 * // In auction loop
 * if (timer <= 0) {
 *   if (mustExtendAuction(currentBid, currentPlayer, true)) {
 *     resetTimer(); // Extend timer
 *     continue; // Continue auction
 *   }
 * }
 * ```
 */
export function mustExtendAuction(
  currentBid: number,
  player: Player,
  timerExpired: boolean
): boolean {
  const result = validateAuctionPrice(currentBid, player, timerExpired);
  return result.mustExtend;
}

