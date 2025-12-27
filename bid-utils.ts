/**
 * Bid Utilities for IPL Auction
 *
 * Implements IPL-style bid increments based on current bid amount
 */

/**
 * Get the bid increment amount based on current bid (IPL rules)
 *
 * Rules:
 * - If currentBid < 5 Cr → increment by 0.25 Cr
 * - If currentBid is between 5–10 Cr → increment by 0.5 Cr
 * - If currentBid > 10 Cr → increment by 1 Cr
 *
 * @param currentBid - Current bid amount in Crores
 * @returns Increment amount in Crores
 */
export function getBidIncrement(currentBid: number): number {
  if (currentBid < 5) {
    return 0.25;
  } else if (currentBid >= 5 && currentBid < 10) {
    return 0.5;
  } else {
    return 1.0;
  }
}

/**
 * Calculate the next bid amount based on IPL increment rules
 *
 * @param currentBid - Current bid amount in Crores
 * @returns Next bid amount in Crores (rounded to 2 decimal places)
 *
 * @example
 * ```typescript
 * getNextBid(4.5);  // Returns 4.75 (0.25 increment)
 * getNextBid(5.0);  // Returns 5.5 (0.5 increment)
 * getNextBid(10.0); // Returns 11.0 (1.0 increment)
 * ```
 */
export function getNextBid(currentBid: number): number {
  const increment = getBidIncrement(currentBid);
  const nextBid = currentBid + increment;
  
  // Round to 2 decimal places for currency precision
  return Math.round(nextBid * 100) / 100;
}

/**
 * Get multiple next bid amounts (for preview/planning)
 *
 * @param currentBid - Current bid amount in Crores
 * @param count - Number of future bids to calculate
 * @returns Array of next bid amounts
 */
export function getNextBids(currentBid: number, count: number = 5): number[] {
  const bids: number[] = [];
  let bid = currentBid;
  
  for (let i = 0; i < count; i++) {
    bid = getNextBid(bid);
    bids.push(bid);
  }
  
  return bids;
}

