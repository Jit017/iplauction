import { Team, Player, PlayerRole } from './types';
import { getNextBid } from './bid-utils';

/**
 * Result of AI bidding decision
 */
export interface BidResult {
  /** Whether the team should place a bid */
  shouldBid: boolean;
  /** Bid amount if shouldBid is true, undefined otherwise */
  bidAmount?: number;
  /** Reason for the decision */
  reason: string;
}

/**
 * Rating band configuration
 */
export enum RatingBand {
  ELITE = 'elite', // > 90
  PREMIUM = 'premium', // 80-90
  STANDARD = 'standard', // 70-80
  CONSERVATIVE = 'conservative', // < 70
}

/**
 * Configuration for AI bidding behavior
 */
export interface BiddingConfig {
  /** Minimum player rating threshold (0-100) */
  minRatingThreshold?: number;
  /** Bid increment amount */
  bidIncrement?: number;
  /** Base probability multiplier for aggression (0-1) */
  baseBidProbability?: number;
  /** Enable rating band-based bidding */
  useRatingBands?: boolean;
}

/**
 * Default bidding configuration
 */
const DEFAULT_CONFIG: Required<BiddingConfig> = {
  minRatingThreshold: 50,
  bidIncrement: 0.25, // 0.25 Crores increment
  baseBidProbability: 0.3,
  useRatingBands: true,
};

/**
 * Get rating band for a player
 */
export function getRatingBand(rating: number): RatingBand {
  if (rating > 90) return RatingBand.ELITE;
  if (rating >= 80) return RatingBand.PREMIUM;
  if (rating >= 70) return RatingBand.STANDARD;
  return RatingBand.CONSERVATIVE;
}

/**
 * Calculates the number of players of a specific role in the team's squad
 */
function getRoleCount(team: Team, role: PlayerRole): number {
  return team.squad.filter((player) => player.role === role).length;
}

/**
 * Checks if team still needs players of a specific role
 * Also handles WICKET_KEEPER_BATSMAN counting towards wicket-keeper requirement
 */
function needsRole(team: Team, role: PlayerRole): boolean {
  const currentCount = getRoleCount(team, role);
  let requiredCount = team.roleNeeds[role] || 0;
  
  // Special handling: WICKET_KEEPER_BATSMAN can count towards wicket-keeper requirement
  if (role === PlayerRole.WICKET_KEEPER) {
    const wkBatCount = getRoleCount(team, PlayerRole.WICKET_KEEPER_BATSMAN);
    const totalWicketKeepers = currentCount + wkBatCount;
    return totalWicketKeepers < requiredCount;
  }
  
  return currentCount < requiredCount;
}

/**
 * Calculates the next bid amount using IPL-style increments
 * This function now uses the centralized getNextBid utility
 */
function calculateNextBid(currentBid: number): number {
  return getNextBid(currentBid);
}

/**
 * Calculates bid probability based on rating band and other factors
 */
function calculateBidProbabilityWithBands(
  team: Team,
  player: Player,
  currentBid: number,
  config: Required<BiddingConfig>
): number {
  const ratingBand = getRatingBand(player.rating);
  const priceRatio = currentBid / player.maxPrice;

  // Base probability varies by rating band
  let baseProbability: number;
  let aggressionMultiplier: number;
  let maxPriceDropoffStart: number; // When to start dropping probability near maxPrice

  switch (ratingBand) {
    case RatingBand.ELITE: // > 90: Multiple teams bid aggressively
      baseProbability = 0.7; // High base probability
      aggressionMultiplier = 1.5; // Aggression has strong effect
      maxPriceDropoffStart = 0.85; // Stay aggressive until very close to max
      break;

    case RatingBand.PREMIUM: // 80-90: Selective bidding
      baseProbability = 0.5; // Moderate base probability
      aggressionMultiplier = 1.2; // Aggression has moderate effect
      maxPriceDropoffStart = 0.80; // Start dropping earlier
      break;

    case RatingBand.STANDARD: // 70-80: Standard bidding
      baseProbability = 0.35; // Lower base probability
      aggressionMultiplier = 1.0; // Standard aggression effect
      maxPriceDropoffStart = 0.75; // Drop off earlier
      break;

    case RatingBand.CONSERVATIVE: // < 70: Conservative bidding
      baseProbability = 0.2; // Low base probability
      aggressionMultiplier = 0.8; // Reduced aggression effect
      maxPriceDropoffStart = 0.70; // Drop off much earlier
      break;
  }

  // Apply aggression multiplier
  // Ensure minimum probability based on rating band to encourage bidding
  let probability = baseProbability * (1 + (team.aggression / 100 - 0.5) * aggressionMultiplier);
  
  // Boost probability at base price to encourage initial bidding
  if (currentBid <= player.basePrice * 1.1) { // Within 10% of base price
    probability *= 1.2; // 20% boost to encourage initial bids
  }

  // Increase probability if player is capped
  if (player.isCapped) {
    probability *= 1.15;
  }

  // Increase probability if player popularity is high
  const popularityFactor = player.popularity / 100;
  probability *= (0.8 + popularityFactor * 0.2);
  
  // Reduce probability if role requirement is already met (but don't eliminate it)
  // This allows teams to bid for upgrades/backups but with lower probability
  // Note: needsRole is called in aiBid, so we need to check here too
  // We'll use a simple heuristic: if squad has many players of this role, reduce probability
  const roleCount = getRoleCount(team, player.role);
  const roleNeeds = team.roleNeeds[player.role] || 0;
  if (roleCount >= roleNeeds) {
    // Reduce probability by 40% if role is filled, but still allow bidding
    // Elite players get less reduction (only 20%) to encourage upgrades
    const reductionFactor = player.rating > 85 ? 0.8 : 0.6;
    probability *= reductionFactor;
  }

  // Natural dropoff near maxPrice - teams drop out gradually
  if (priceRatio >= maxPriceDropoffStart) {
    // Calculate dropoff factor (0 to 1)
    const dropoffRange = 1 - maxPriceDropoffStart;
    const dropoffProgress = (priceRatio - maxPriceDropoffStart) / dropoffRange;
    
    // More aggressive dropoff for lower-rated players
    let dropoffRate: number;
    switch (ratingBand) {
      case RatingBand.ELITE:
        dropoffRate = 0.3; // Gentle dropoff - stay in longer
        break;
      case RatingBand.PREMIUM:
        dropoffRate = 0.5; // Moderate dropoff
        break;
      case RatingBand.STANDARD:
        dropoffRate = 0.7; // Stronger dropoff
        break;
      case RatingBand.CONSERVATIVE:
        dropoffRate = 0.9; // Very strong dropoff
        break;
    }
    
    // Apply exponential dropoff for natural exit
    const dropoffFactor = Math.pow(1 - dropoffProgress, 1 / dropoffRate);
    probability *= dropoffFactor;
  }

  // Ensure probability is between 0 and 1
  return Math.max(0, Math.min(1, probability));
}

/**
 * Calculates bid probability based on aggression and other factors (legacy method)
 */
function calculateBidProbability(
  team: Team,
  player: Player,
  currentBid: number,
  config: Required<BiddingConfig>
): number {
  // Base probability from aggression (0-100 scale converted to 0-1)
  let probability = (team.aggression / 100) * config.baseBidProbability;

  // Increase probability if player rating is high
  const ratingFactor = player.rating / 100;
  probability *= (0.5 + ratingFactor * 0.5);

  // Increase probability if player is capped
  if (player.isCapped) {
    probability *= 1.2;
  }

  // Increase probability if player popularity is high
  const popularityFactor = player.popularity / 100;
  probability *= (0.7 + popularityFactor * 0.3);

  // Decrease probability if bid is getting close to maxPrice
  const priceRatio = currentBid / player.maxPrice;
  if (priceRatio > 0.8) {
    probability *= (1 - (priceRatio - 0.8) * 2); // Reduce probability as we approach max
  }

  // Ensure probability is between 0 and 1
  return Math.max(0, Math.min(1, probability));
}

/**
 * AI bidding function for IPL teams.
 *
 * Team will bid only if:
 * - Team has enough purse for next bid
 * - Player rating meets team expectations
 * - Team still needs the player's role
 * - Current bid is below player's maxPrice
 *
 * @param team - Team making the bidding decision
 * @param player - Player being auctioned
 * @param currentBid - Current highest bid amount
 * @param config - Optional bidding configuration
 * @returns BidResult indicating whether to bid or pass
 *
 * @example
 * ```typescript
 * const result = aiBid(team, player, 5.5);
 * if (result.shouldBid) {
 *   placeBid(team, result.bidAmount!);
 * }
 * ```
 */
export function aiBid(
  team: Team,
  player: Player,
  currentBid: number,
  config: BiddingConfig = {}
): BidResult {
  const finalConfig: Required<BiddingConfig> = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Check if current bid is already at or above maxPrice
  if (currentBid >= player.maxPrice) {
    return {
      shouldBid: false,
      reason: `Current bid (${currentBid}) is at or above player's maxPrice (${player.maxPrice})`,
    };
  }

  // Calculate next bid amount using IPL-style increments
  const nextBid = calculateNextBid(currentBid);

  // Check if team has enough purse for next bid
  if (team.purse < nextBid) {
    return {
      shouldBid: false,
      reason: `Insufficient purse. Required: ${nextBid}, Available: ${team.purse}`,
    };
  }

  // Enhanced dropout logic: Teams close to maxPrice or with low purse drop out
  const priceGapToMax = player.maxPrice - currentBid;
  const priceGapPercentage = (priceGapToMax / player.maxPrice) * 100;
  const pursePercentage = (team.purse / 100) * 100; // Assuming 100 Cr is full purse
  
  // Drop out if too close to maxPrice (within 5% or less than 2 Cr gap)
  if (priceGapPercentage < 5 || priceGapToMax < 2) {
    return {
      shouldBid: false,
      reason: `Too close to maxPrice. Gap: ${priceGapToMax.toFixed(2)} Cr (${priceGapPercentage.toFixed(1)}%)`,
    };
  }
  
  // Drop out if purse is very low (less than 10 Cr remaining)
  if (team.purse < 10) {
    return {
      shouldBid: false,
      reason: `Purse too low (${team.purse.toFixed(2)} Cr). Conserving funds.`,
    };
  }
  
  // Drop out if next bid would leave very little purse (less than 5 Cr)
  if (team.purse - nextBid < 5) {
    return {
      shouldBid: false,
      reason: `Bid would leave insufficient purse (${(team.purse - nextBid).toFixed(2)} Cr remaining)`,
    };
  }

  // Check if player rating meets team expectations
  if (player.rating < finalConfig.minRatingThreshold) {
    return {
      shouldBid: false,
      reason: `Player rating (${player.rating}) below team threshold (${finalConfig.minRatingThreshold})`,
    };
  }

  // Check squad size - don't bid if squad is full (max 25 players)
  const MAX_SQUAD_SIZE = 25;
  if (team.squad.length >= MAX_SQUAD_SIZE) {
    return {
      shouldBid: false,
      reason: `Squad is full (${team.squad.length}/${MAX_SQUAD_SIZE} players)`,
    };
  }

  // Check if team needs the player's role
  // Allow bidding even if minimum requirements are met (for upgrades/backups)
  // but reduce probability if requirements are already met
  const roleNeeded = needsRole(team, player.role);
  
  // If role is not needed AND squad is getting large, skip bidding
  // But still allow bidding for elite players (rating > 85) even if role is filled
  if (!roleNeeded && team.squad.length >= 20) {
    // Only allow elite players if role is filled and squad is large
    if (player.rating <= 85) {
      return {
        shouldBid: false,
        reason: `Team already has sufficient ${player.role} players and squad is large (${team.squad.length}/25)`,
      };
    }
    // For elite players, continue but will reduce probability later
  }

  // Check if next bid would exceed maxPrice
  if (nextBid > player.maxPrice) {
    return {
      shouldBid: false,
      reason: `Next bid (${nextBid}) would exceed player's maxPrice (${player.maxPrice})`,
    };
  }

  // Enhanced aggression for star players (rating > 85)
  // Star players increase AI aggression by up to 30%
  const isStarPlayer = player.rating > 85;
  const starPlayerMultiplier = isStarPlayer 
    ? 1 + ((player.rating - 85) / 15) * 0.3 // 0-30% increase based on rating above 85
    : 1;
  
  // Adjust team aggression based on star player status
  const effectiveAggression = Math.min(100, team.aggression * starPlayerMultiplier);
  
  // Create modified team with enhanced aggression for star players
  const enhancedTeam: Team = {
    ...team,
    aggression: effectiveAggression,
  };

  // All basic conditions met, now apply probability-based decision
  const bidProbability = finalConfig.useRatingBands
    ? calculateBidProbabilityWithBands(enhancedTeam, player, currentBid, finalConfig)
    : calculateBidProbability(enhancedTeam, player, currentBid, finalConfig);

  // Make decision based on probability
  const randomValue = Math.random();
  if (randomValue > bidProbability) {
    const ratingBand = getRatingBand(player.rating);
    return {
      shouldBid: false,
      reason: `Bid probability (${(bidProbability * 100).toFixed(1)}%) not met. Rating band: ${ratingBand}, Random: ${(randomValue * 100).toFixed(1)}%`,
    };
  }

  // Team decides to bid
  const ratingBand = finalConfig.useRatingBands ? getRatingBand(player.rating) : undefined;
  const aggressionNote = isStarPlayer 
    ? ` (enhanced: ${effectiveAggression.toFixed(0)} for star player)` 
    : '';
  return {
    shouldBid: true,
    bidAmount: nextBid,
    reason: `Bidding ${nextBid} (aggression: ${team.aggression}${aggressionNote}, probability: ${(bidProbability * 100).toFixed(1)}%${ratingBand ? `, band: ${ratingBand}` : ''})`,
  };
}

/**
 * Determines if a team should stop bidding (for stopping logic).
 * This can be used to prevent teams from bidding indefinitely.
 * Enhanced with rating band awareness for natural dropouts.
 *
 * @param team - Team making the decision
 * @param player - Player being auctioned
 * @param currentBid - Current highest bid amount
 * @param consecutiveBids - Number of consecutive bids this team has made
 * @param maxConsecutiveBids - Maximum allowed consecutive bids (default: varies by rating)
 * @returns true if team should stop bidding
 */
export function shouldStopBidding(
  team: Team,
  player: Player,
  currentBid: number,
  consecutiveBids: number = 0,
  maxConsecutiveBids?: number
): boolean {
  const ratingBand = getRatingBand(player.rating);
  const priceRatio = currentBid / player.maxPrice;

  // Dynamic max consecutive bids based on rating band
  if (maxConsecutiveBids === undefined) {
    switch (ratingBand) {
      case RatingBand.ELITE:
        maxConsecutiveBids = 5; // More bids for elite players
        break;
      case RatingBand.PREMIUM:
        maxConsecutiveBids = 4;
        break;
      case RatingBand.STANDARD:
        maxConsecutiveBids = 3;
        break;
      case RatingBand.CONSERVATIVE:
        maxConsecutiveBids = 2; // Fewer bids for lower-rated players
        break;
    }
  }

  // Stop if exceeded max consecutive bids
  if (consecutiveBids >= maxConsecutiveBids) {
    return true;
  }

  // Natural dropout near maxPrice - varies by rating band
  let maxPriceThreshold: number;
  switch (ratingBand) {
    case RatingBand.ELITE:
      maxPriceThreshold = 0.95; // Elite players: stay until 95% of maxPrice
      break;
    case RatingBand.PREMIUM:
      maxPriceThreshold = 0.90; // Premium: drop out at 90%
      break;
    case RatingBand.STANDARD:
      maxPriceThreshold = 0.85; // Standard: drop out at 85%
      break;
    case RatingBand.CONSERVATIVE:
      maxPriceThreshold = 0.80; // Conservative: drop out early at 80%
      break;
  }

  if (priceRatio >= maxPriceThreshold) {
    return true;
  }

  // Stop if remaining purse is getting low
  if (team.purse < 10) {
    return true;
  }

  // Additional check: if bid is very close to maxPrice in absolute terms
  const priceGap = player.maxPrice - currentBid;
  const absoluteThreshold = ratingBand === RatingBand.ELITE ? 0.5 : 0.25;
  if (priceGap <= absoluteThreshold) {
    return true;
  }

  return false;
}

/**
 * Enhanced AI bidding function that includes stopping logic.
 * Combines aiBid with shouldStopBidding for complete bidding decision.
 *
 * @param team - Team making the bidding decision
 * @param player - Player being auctioned
 * @param currentBid - Current highest bid amount
 * @param consecutiveBids - Number of consecutive bids this team has made
 * @param config - Optional bidding configuration
 * @returns BidResult indicating whether to bid or pass
 */
export function aiBidWithStopping(
  team: Team,
  player: Player,
  currentBid: number,
  consecutiveBids: number = 0,
  config: BiddingConfig = {}
): BidResult {
  // First check if team should stop bidding
  if (shouldStopBidding(team, player, currentBid, consecutiveBids)) {
    const ratingBand = getRatingBand(player.rating);
    return {
      shouldBid: false,
      reason: `Team decided to stop bidding (rating band: ${ratingBand}, stopping logic triggered)`,
    };
  }

  // Then proceed with normal AI bidding logic
  return aiBid(team, player, currentBid, config);
}

/**
 * Get bidding intensity multiplier based on rating band
 * Used to encourage multiple teams to bid on elite players
 *
 * @param rating - Player rating
 * @returns Multiplier for bidding intensity
 */
export function getBiddingIntensityMultiplier(rating: number): number {
  const ratingBand = getRatingBand(rating);
  switch (ratingBand) {
    case RatingBand.ELITE:
      return 1.5; // High intensity - encourages multiple teams
    case RatingBand.PREMIUM:
      return 1.2; // Moderate intensity
    case RatingBand.STANDARD:
      return 1.0; // Standard intensity
    case RatingBand.CONSERVATIVE:
      return 0.7; // Low intensity - fewer teams interested
  }
}

/**
 * Check if a player's rating band typically attracts multiple bidders
 *
 * @param rating - Player rating
 * @returns true if rating band typically sees aggressive multi-team bidding
 */
export function attractsMultipleBidders(rating: number): boolean {
  const ratingBand = getRatingBand(rating);
  return ratingBand === RatingBand.ELITE || ratingBand === RatingBand.PREMIUM;
}

