var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// types.ts
var init_types = __esm({
  "types.ts"() {
  }
});

// auction-price-validator.ts
function validateAuctionPrice(currentBid, player, timerExpired) {
  if (currentBid < player.minPrice) {
    if (timerExpired) {
      return {
        canEnd: false,
        mustExtend: true,
        isValid: false,
        error: `Bid (${currentBid}) is below minimum price (${player.minPrice}). Auction must continue.`
      };
    }
    return {
      canEnd: false,
      mustExtend: false,
      isValid: false,
      error: `Bid (${currentBid}) cannot be below minimum price (${player.minPrice}).`
    };
  }
  if (currentBid > player.maxPrice) {
    return {
      canEnd: false,
      mustExtend: false,
      isValid: false,
      error: `Bid (${currentBid}) cannot exceed maximum price (${player.maxPrice}).`
    };
  }
  if (timerExpired) {
    return {
      canEnd: true,
      mustExtend: false,
      isValid: true
    };
  }
  return {
    canEnd: false,
    mustExtend: false,
    isValid: true
  };
}
function validateBidAmount(bid, player) {
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
var PriceValidationError;
var init_auction_price_validator = __esm({
  "auction-price-validator.ts"() {
    PriceValidationError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "PriceValidationError";
      }
    };
  }
});

// bid-utils.ts
function getBidIncrement(currentBid) {
  if (currentBid < 5) {
    return 0.25;
  } else if (currentBid >= 5 && currentBid < 10) {
    return 0.5;
  } else {
    return 1;
  }
}
function getNextBid(currentBid) {
  const increment = getBidIncrement(currentBid);
  const nextBid = currentBid + increment;
  return Math.round(nextBid * 100) / 100;
}
var init_bid_utils = __esm({
  "bid-utils.ts"() {
  }
});

// auction-pool.ts
function getRetainedPlayerIds(teams3) {
  const retainedIds = /* @__PURE__ */ new Set();
  teams3.forEach((team) => {
    team.retainedPlayers.forEach((player) => {
      retainedIds.add(player.id);
    });
  });
  return retainedIds;
}
function getSquadPlayerIds(teams3) {
  const squadIds = /* @__PURE__ */ new Set();
  teams3.forEach((team) => {
    team.squad.forEach((player) => {
      squadIds.add(player.id);
    });
  });
  return squadIds;
}
function getUnavailablePlayerIds(teams3) {
  const unavailableIds = /* @__PURE__ */ new Set();
  teams3.forEach((team) => {
    team.retainedPlayers.forEach((player) => {
      unavailableIds.add(player.id);
    });
    team.squad.forEach((player) => {
      unavailableIds.add(player.id);
    });
  });
  return unavailableIds;
}
function isPlayerRetained(player, teams3) {
  const retainedIds = getRetainedPlayerIds(teams3);
  return retainedIds.has(player.id);
}
function isPlayerInSquad(player, teams3) {
  const squadIds = getSquadPlayerIds(teams3);
  return squadIds.has(player.id);
}
function isPlayerAvailableForAuction(player, teams3) {
  return !isPlayerRetained(player, teams3) && !isPlayerInSquad(player, teams3);
}
function getAuctionablePlayers(players2, teams3) {
  const unavailableIds = getUnavailablePlayerIds(teams3);
  return players2.filter((player) => !unavailableIds.has(player.id));
}
function checkForDuplicate(player, teams3, auctionedPlayers) {
  if (isPlayerRetained(player, teams3)) {
    const retainingTeam = teams3.find(
      (team) => team.retainedPlayers.some((p) => p.id === player.id)
    );
    return {
      isDuplicate: true,
      reason: `Player "${player.name}" is already retained by ${retainingTeam?.name || "a team"}`,
      location: "retained"
    };
  }
  if (isPlayerInSquad(player, teams3)) {
    const owningTeam = teams3.find(
      (team) => team.squad.some((p) => p.id === player.id)
    );
    return {
      isDuplicate: true,
      reason: `Player "${player.name}" is already in ${owningTeam?.name || "a team"}'s squad`,
      location: "squad"
    };
  }
  if (auctionedPlayers && auctionedPlayers.has(player.id)) {
    return {
      isDuplicate: true,
      reason: `Player "${player.name}" has already been auctioned`,
      location: "auctioned"
    };
  }
  return {
    isDuplicate: false
  };
}
function validatePlayerForAuction(player, teams3, auctionedPlayers) {
  const duplicateCheck = checkForDuplicate(player, teams3, auctionedPlayers);
  if (duplicateCheck.isDuplicate) {
    throw new Error(duplicateCheck.reason || "Player is a duplicate");
  }
}
function getAuctionPoolStats(players2, teams3) {
  const retainedIds = getRetainedPlayerIds(teams3);
  const squadIds = getSquadPlayerIds(teams3);
  const unavailableIds = getUnavailablePlayerIds(teams3);
  const auctionable = players2.filter(
    (player) => !unavailableIds.has(player.id)
  );
  return {
    totalPlayers: players2.length,
    retainedPlayers: retainedIds.size,
    squadPlayers: squadIds.size,
    auctionablePlayers: auctionable.length,
    unavailablePlayers: unavailableIds.size
  };
}
var init_auction_pool = __esm({
  "auction-pool.ts"() {
  }
});

// squad-validator.ts
var MIN_ROLE_REQUIREMENTS, defaultOverseasCheck;
var init_squad_validator = __esm({
  "squad-validator.ts"() {
    init_types();
    MIN_ROLE_REQUIREMENTS = {
      ["Batsman" /* BATSMAN */]: 6,
      ["Bowler" /* BOWLER */]: 6,
      ["All-rounder" /* ALL_ROUNDER */]: 2,
      ["Wicket-keeper" /* WICKET_KEEPER */]: 1,
      ["Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */]: 0
      // Can count towards wicket-keeper requirement
    };
    defaultOverseasCheck = (player) => {
      return false;
    };
  }
});

// ai-bidding.ts
function getRatingBand(rating) {
  if (rating > 90)
    return "elite" /* ELITE */;
  if (rating >= 80)
    return "premium" /* PREMIUM */;
  if (rating >= 70)
    return "standard" /* STANDARD */;
  return "conservative" /* CONSERVATIVE */;
}
function getRoleCount(team, role) {
  return team.squad.filter((player) => player.role === role).length;
}
function needsRole(team, role) {
  const currentCount = getRoleCount(team, role);
  let requiredCount = team.roleNeeds[role] || 0;
  if (role === "Wicket-keeper" /* WICKET_KEEPER */) {
    const wkBatCount = getRoleCount(team, "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */);
    const totalWicketKeepers = currentCount + wkBatCount;
    return totalWicketKeepers < requiredCount;
  }
  return currentCount < requiredCount;
}
function calculateNextBid(currentBid) {
  return getNextBid(currentBid);
}
function calculateBidProbabilityWithBands(team, player, currentBid, config) {
  const ratingBand = getRatingBand(player.rating);
  const priceRatio = currentBid / player.maxPrice;
  let baseProbability;
  let aggressionMultiplier;
  let maxPriceDropoffStart;
  switch (ratingBand) {
    case "elite" /* ELITE */:
      baseProbability = 0.7;
      aggressionMultiplier = 1.5;
      maxPriceDropoffStart = 0.85;
      break;
    case "premium" /* PREMIUM */:
      baseProbability = 0.5;
      aggressionMultiplier = 1.2;
      maxPriceDropoffStart = 0.8;
      break;
    case "standard" /* STANDARD */:
      baseProbability = 0.35;
      aggressionMultiplier = 1;
      maxPriceDropoffStart = 0.75;
      break;
    case "conservative" /* CONSERVATIVE */:
      baseProbability = 0.2;
      aggressionMultiplier = 0.8;
      maxPriceDropoffStart = 0.7;
      break;
  }
  let probability = baseProbability * (1 + (team.aggression / 100 - 0.5) * aggressionMultiplier);
  if (currentBid <= player.basePrice * 1.1) {
    probability *= 1.2;
  }
  if (player.isCapped) {
    probability *= 1.15;
  }
  const popularityFactor = player.popularity / 100;
  probability *= 0.8 + popularityFactor * 0.2;
  const roleCount = getRoleCount(team, player.role);
  const roleNeeds = team.roleNeeds[player.role] || 0;
  if (roleCount >= roleNeeds) {
    const reductionFactor = player.rating > 85 ? 0.8 : 0.6;
    probability *= reductionFactor;
  }
  if (priceRatio >= maxPriceDropoffStart) {
    const dropoffRange = 1 - maxPriceDropoffStart;
    const dropoffProgress = (priceRatio - maxPriceDropoffStart) / dropoffRange;
    let dropoffRate;
    switch (ratingBand) {
      case "elite" /* ELITE */:
        dropoffRate = 0.3;
        break;
      case "premium" /* PREMIUM */:
        dropoffRate = 0.5;
        break;
      case "standard" /* STANDARD */:
        dropoffRate = 0.7;
        break;
      case "conservative" /* CONSERVATIVE */:
        dropoffRate = 0.9;
        break;
    }
    const dropoffFactor = Math.pow(1 - dropoffProgress, 1 / dropoffRate);
    probability *= dropoffFactor;
  }
  return Math.max(0, Math.min(1, probability));
}
function calculateBidProbability(team, player, currentBid, config) {
  let probability = team.aggression / 100 * config.baseBidProbability;
  const ratingFactor = player.rating / 100;
  probability *= 0.5 + ratingFactor * 0.5;
  if (player.isCapped) {
    probability *= 1.2;
  }
  const popularityFactor = player.popularity / 100;
  probability *= 0.7 + popularityFactor * 0.3;
  const priceRatio = currentBid / player.maxPrice;
  if (priceRatio > 0.8) {
    probability *= 1 - (priceRatio - 0.8) * 2;
  }
  return Math.max(0, Math.min(1, probability));
}
function aiBid(team, player, currentBid, config = {}) {
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config
  };
  if (currentBid >= player.maxPrice) {
    return {
      shouldBid: false,
      reason: `Current bid (${currentBid}) is at or above player's maxPrice (${player.maxPrice})`
    };
  }
  const nextBid = calculateNextBid(currentBid);
  if (team.purse < nextBid) {
    return {
      shouldBid: false,
      reason: `Insufficient purse. Required: ${nextBid}, Available: ${team.purse}`
    };
  }
  const priceGapToMax = player.maxPrice - currentBid;
  const priceGapPercentage = priceGapToMax / player.maxPrice * 100;
  const pursePercentage = team.purse / 100 * 100;
  if (priceGapPercentage < 5 || priceGapToMax < 2) {
    return {
      shouldBid: false,
      reason: `Too close to maxPrice. Gap: ${priceGapToMax.toFixed(2)} Cr (${priceGapPercentage.toFixed(1)}%)`
    };
  }
  if (team.purse < 10) {
    return {
      shouldBid: false,
      reason: `Purse too low (${team.purse.toFixed(2)} Cr). Conserving funds.`
    };
  }
  if (team.purse - nextBid < 5) {
    return {
      shouldBid: false,
      reason: `Bid would leave insufficient purse (${(team.purse - nextBid).toFixed(2)} Cr remaining)`
    };
  }
  if (player.rating < finalConfig.minRatingThreshold) {
    return {
      shouldBid: false,
      reason: `Player rating (${player.rating}) below team threshold (${finalConfig.minRatingThreshold})`
    };
  }
  const MAX_SQUAD_SIZE = 25;
  if (team.squad.length >= MAX_SQUAD_SIZE) {
    return {
      shouldBid: false,
      reason: `Squad is full (${team.squad.length}/${MAX_SQUAD_SIZE} players)`
    };
  }
  const roleNeeded = needsRole(team, player.role);
  if (!roleNeeded && team.squad.length >= 20) {
    if (player.rating <= 85) {
      return {
        shouldBid: false,
        reason: `Team already has sufficient ${player.role} players and squad is large (${team.squad.length}/25)`
      };
    }
  }
  if (nextBid > player.maxPrice) {
    return {
      shouldBid: false,
      reason: `Next bid (${nextBid}) would exceed player's maxPrice (${player.maxPrice})`
    };
  }
  const isStarPlayer = player.rating > 85;
  const starPlayerMultiplier = isStarPlayer ? 1 + (player.rating - 85) / 15 * 0.3 : 1;
  const effectiveAggression = Math.min(100, team.aggression * starPlayerMultiplier);
  const enhancedTeam = {
    ...team,
    aggression: effectiveAggression
  };
  const bidProbability = finalConfig.useRatingBands ? calculateBidProbabilityWithBands(enhancedTeam, player, currentBid, finalConfig) : calculateBidProbability(enhancedTeam, player, currentBid, finalConfig);
  const randomValue = Math.random();
  if (randomValue > bidProbability) {
    const ratingBand2 = getRatingBand(player.rating);
    return {
      shouldBid: false,
      reason: `Bid probability (${(bidProbability * 100).toFixed(1)}%) not met. Rating band: ${ratingBand2}, Random: ${(randomValue * 100).toFixed(1)}%`
    };
  }
  const ratingBand = finalConfig.useRatingBands ? getRatingBand(player.rating) : void 0;
  const aggressionNote = isStarPlayer ? ` (enhanced: ${effectiveAggression.toFixed(0)} for star player)` : "";
  return {
    shouldBid: true,
    bidAmount: nextBid,
    reason: `Bidding ${nextBid} (aggression: ${team.aggression}${aggressionNote}, probability: ${(bidProbability * 100).toFixed(1)}%${ratingBand ? `, band: ${ratingBand}` : ""})`
  };
}
function shouldStopBidding(team, player, currentBid, consecutiveBids = 0, maxConsecutiveBids) {
  const ratingBand = getRatingBand(player.rating);
  const priceRatio = currentBid / player.maxPrice;
  if (maxConsecutiveBids === void 0) {
    switch (ratingBand) {
      case "elite" /* ELITE */:
        maxConsecutiveBids = 5;
        break;
      case "premium" /* PREMIUM */:
        maxConsecutiveBids = 4;
        break;
      case "standard" /* STANDARD */:
        maxConsecutiveBids = 3;
        break;
      case "conservative" /* CONSERVATIVE */:
        maxConsecutiveBids = 2;
        break;
    }
  }
  if (consecutiveBids >= maxConsecutiveBids) {
    return true;
  }
  let maxPriceThreshold;
  switch (ratingBand) {
    case "elite" /* ELITE */:
      maxPriceThreshold = 0.95;
      break;
    case "premium" /* PREMIUM */:
      maxPriceThreshold = 0.9;
      break;
    case "standard" /* STANDARD */:
      maxPriceThreshold = 0.85;
      break;
    case "conservative" /* CONSERVATIVE */:
      maxPriceThreshold = 0.8;
      break;
  }
  if (priceRatio >= maxPriceThreshold) {
    return true;
  }
  if (team.purse < 10) {
    return true;
  }
  const priceGap = player.maxPrice - currentBid;
  const absoluteThreshold = ratingBand === "elite" /* ELITE */ ? 0.5 : 0.25;
  if (priceGap <= absoluteThreshold) {
    return true;
  }
  return false;
}
function aiBidWithStopping(team, player, currentBid, consecutiveBids = 0, config = {}) {
  if (shouldStopBidding(team, player, currentBid, consecutiveBids)) {
    const ratingBand = getRatingBand(player.rating);
    return {
      shouldBid: false,
      reason: `Team decided to stop bidding (rating band: ${ratingBand}, stopping logic triggered)`
    };
  }
  return aiBid(team, player, currentBid, config);
}
var DEFAULT_CONFIG;
var init_ai_bidding = __esm({
  "ai-bidding.ts"() {
    init_types();
    init_bid_utils();
    DEFAULT_CONFIG = {
      minRatingThreshold: 50,
      bidIncrement: 0.25,
      // 0.25 Crores increment
      baseBidProbability: 0.3,
      useRatingBands: true
    };
  }
});

// auction-engine.ts
var DEFAULT_CONFIG2, AuctionEngine;
var init_auction_engine = __esm({
  "auction-engine.ts"() {
    init_types();
    init_auction_price_validator();
    init_bid_utils();
    init_auction_pool();
    init_squad_validator();
    init_ai_bidding();
    DEFAULT_CONFIG2 = {
      timerDuration: 30,
      // 30 seconds default
      bidIncrement: 0.25,
      // Deprecated - increments now follow IPL rules via getNextBid()
      tickInterval: 1e3
      // 1 second
    };
    AuctionEngine = class {
      /**
       * Creates a new auction engine instance
       *
       * @param teams - Array of teams participating in the auction
       * @param config - Optional configuration for the auction engine
       */
      constructor(teams3, config = {}) {
        this.subscriptions = /* @__PURE__ */ new Set();
        this.timerInterval = null;
        this.lastBidTime = 0;
        this.userSelectedTeamId = null;
        this.aiBidProcessedThisTick = false;
        this.teams = teams3;
        this.config = { ...DEFAULT_CONFIG2, ...config };
        this.state = {
          currentPlayer: null,
          currentBid: 0,
          leadingTeam: null,
          timer: 0,
          status: "idle" /* IDLE */
        };
        this.userSelectedTeamId = null;
        this.aiBidProcessedThisTick = false;
      }
      /**
       * Set the user-selected team ID (for AI bidding exclusion)
       */
      setUserSelectedTeam(teamId) {
        this.userSelectedTeamId = teamId;
      }
      /**
       * Subscribe to auction events
       *
       * @param callback - Function to call when events occur
       * @returns Unsubscribe function
       */
      subscribe(callback) {
        this.subscriptions.add(callback);
        return () => {
          this.subscriptions.delete(callback);
        };
      }
      /**
       * Emit an event to all subscribers
       */
      emit(event) {
        this.subscriptions.forEach((callback) => {
          try {
            callback(event);
          } catch (error) {
            console.error("Error in subscription callback:", error);
          }
        });
      }
      /**
       * Update state and notify subscribers
       */
      updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.emit({
          type: "state_changed" /* STATE_CHANGED */,
          state: this.state
        });
      }
      /**
       * Set the current player to be auctioned
       *
       * @param player - Player to auction
       * @throws {Error} If auction is not in IDLE state or player is retained
       */
      setCurrentPlayer(player) {
        if (this.state.status !== "idle" /* IDLE */) {
          throw new Error(
            `Cannot set player when auction is in ${this.state.status} state`
          );
        }
        if (isPlayerRetained(player, this.teams)) {
          const retainingTeam = this.teams.find(
            (t) => t.retainedPlayers.some((p) => p.id === player.id)
          );
          const error = `CRITICAL: Cannot auction retained player "${player.name}" (retained by ${retainingTeam?.name || "a team"})`;
          this.emit({
            type: "error" /* ERROR */,
            state: this.state,
            error
          });
          throw new Error(error);
        }
        if (!isPlayerAvailableForAuction(player, this.teams)) {
          const error = `Cannot auction player "${player.name}" - player is retained or already in a squad`;
          this.emit({
            type: "error" /* ERROR */,
            state: this.state,
            error
          });
          throw new Error(error);
        }
        try {
          validatePlayerForAuction(player, this.teams);
        } catch (error) {
          this.emit({
            type: "error" /* ERROR */,
            state: this.state,
            error: error.message || "Player is not available for auction"
          });
          throw error;
        }
        this.updateState({
          currentPlayer: player,
          currentBid: player.basePrice,
          leadingTeam: null,
          status: "bidding" /* BIDDING */,
          timer: this.config.timerDuration
        });
        this.emit({
          type: "player_set" /* PLAYER_SET */,
          state: this.state,
          data: { player }
        });
        this.startTimer();
        setTimeout(() => {
          if (this.state.status === "bidding" /* BIDDING */ && this.state.currentPlayer) {
            this.processAIBidding();
          }
        }, 1e3);
      }
      /**
       * Start the auction timer
       */
      startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => {
          if (this.state.timer > 0) {
            const newTimer = this.state.timer - 1;
            this.updateState({ timer: newTimer });
            this.aiBidProcessedThisTick = false;
            this.emit({
              type: "timer_tick" /* TIMER_TICK */,
              state: this.state,
              data: { timer: newTimer }
            });
            if (this.state.status === "bidding" /* BIDDING */ && this.state.currentPlayer) {
              this.processAIBidding();
            }
            if (newTimer === 0) {
              this.handleTimerExpiry();
            }
          }
        }, this.config.tickInterval);
      }
      /**
       * Stop the auction timer
       */
      stopTimer() {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      }
      /**
       * Handle timer expiry
       * 
       * When timer expires:
       * - If there's a leading team with a valid bid >= base price, sell to that team
       * - If no bids occurred (no leading team), mark as UNSOLD
       * - User skipping doesn't affect the outcome - highest bidder wins
       */
      handleTimerExpiry() {
        this.stopTimer();
        this.emit({
          type: "timer_expired" /* TIMER_EXPIRED */,
          state: this.state
        });
        if (!this.state.currentPlayer) {
          this.endAuctionAsUnsold("No player set");
          return;
        }
        const player = this.state.currentPlayer;
        const currentBid = this.state.currentBid;
        const leadingTeam = this.state.leadingTeam;
        const noBidsOccurred = currentBid === player.basePrice && leadingTeam === null;
        if (noBidsOccurred) {
          this.endAuctionAsUnsold("No bids received before timer ended");
          return;
        }
        if (leadingTeam && currentBid >= player.basePrice) {
          const validation = validateAuctionPrice(
            currentBid,
            player,
            true
            // timer expired
          );
          if (validation.canEnd) {
            this.endAuctionAsSold();
          } else if (validation.mustExtend) {
            this.extendTimer();
          } else {
            this.endAuctionAsUnsold(validation.error || "Invalid auction state");
          }
          return;
        }
        if (currentBid < player.basePrice) {
          this.endAuctionAsUnsold(`Bid (${currentBid}) is below base price (${player.basePrice})`);
          return;
        }
        if (leadingTeam) {
          console.warn("Unexpected state: leading team exists but validation failed. Attempting to sell...");
          this.endAuctionAsSold();
          return;
        }
        this.endAuctionAsUnsold("No valid bidder found");
      }
      /**
       * Extend the timer when bid is below minPrice
       */
      extendTimer() {
        this.updateState({
          timer: this.config.timerDuration
        });
        this.startTimer();
        this.emit({
          type: "state_changed" /* STATE_CHANGED */,
          state: this.state,
          data: { reason: "Timer extended - bid below minPrice" }
        });
      }
      /**
       * Place a manual bid by team ID
       * Convenience method that finds the team and places a bid
       *
       * @param teamId - ID of the team placing the bid
       * @param bidAmount - Optional bid amount (if not provided, uses IPL increment logic)
       * @throws {Error} If team not found, bid is invalid, or auction is not in BIDDING state
       */
      placeManualBid(teamId, bidAmount) {
        const team = this.teams.find((t) => t.id === teamId);
        if (!team) {
          throw new Error(`Team with ID ${teamId} not found`);
        }
        this.acceptBid(team, bidAmount);
      }
      /**
       * Accept a bid from a team
       *
       * @param team - Team placing the bid
       * @param bidAmount - Optional bid amount (if not provided, uses IPL increment logic)
       * @throws {Error} If bid is invalid or auction is not in BIDDING state
       */
      acceptBid(team, bidAmount) {
        if (this.state.status !== "bidding" /* BIDDING */) {
          throw new Error(
            `Cannot accept bid when auction is in ${this.state.status} state`
          );
        }
        if (!this.state.currentPlayer) {
          throw new Error("No player is currently being auctioned");
        }
        const nextBid = bidAmount !== void 0 ? bidAmount : getNextBid(this.state.currentBid);
        try {
          validateBidAmount(nextBid, this.state.currentPlayer);
        } catch (error) {
          if (error instanceof PriceValidationError) {
            this.emit({
              type: "error" /* ERROR */,
              state: this.state,
              error: error.message
            });
            throw error;
          }
          throw error;
        }
        if (team.purse < nextBid) {
          const error = `Team ${team.name} has insufficient purse. Required: ${nextBid}, Available: ${team.purse}`;
          this.emit({
            type: "error" /* ERROR */,
            state: this.state,
            error
          });
          throw new Error(error);
        }
        this.updateState({
          currentBid: nextBid,
          leadingTeam: team,
          timer: this.config.timerDuration
          // Reset timer on new bid
        });
        this.lastBidTime = Date.now();
        this.aiBidProcessedThisTick = false;
        this.emit({
          type: "bid_placed" /* BID_PLACED */,
          state: this.state,
          data: {
            team,
            bidAmount: nextBid,
            previousBid: this.state.currentBid
          }
        });
        this.startTimer();
        setTimeout(() => {
          if (this.state.status === "bidding" /* BIDDING */ && this.state.currentPlayer) {
            this.processAIBidding();
          }
        }, 300);
      }
      /**
       * Process AI bidding for all AI-controlled teams
       * Called on each timer tick and immediately after new bids
       * Enhanced to react competitively to new leading bids
       */
      processAIBidding() {
        if (this.aiBidProcessedThisTick) {
          return;
        }
        if (this.state.timer === 0 || this.state.status !== "bidding" /* BIDDING */) {
          return;
        }
        if (!this.state.currentPlayer) {
          return;
        }
        const currentBid = this.state.currentBid || 0;
        const player = this.state.currentPlayer;
        const leadingTeamId = this.state.leadingTeam?.id;
        const potentialBidders = this.teams.filter(
          (team) => team.id !== this.userSelectedTeamId && team.id !== leadingTeamId
        );
        if (potentialBidders.length === 0) {
          console.debug("No potential AI bidders available");
          return;
        }
        const shuffledBidders = [...potentialBidders].sort(() => Math.random() - 0.5);
        for (const team of shuffledBidders) {
          if (this.state.leadingTeam?.id !== leadingTeamId) {
            break;
          }
          try {
            const aiResult = aiBidWithStopping(team, player, currentBid, 0, {
              useRatingBands: true
            });
            if (aiResult.shouldBid && aiResult.bidAmount) {
              try {
                validateBidAmount(aiResult.bidAmount, player);
                if (team.purse >= aiResult.bidAmount) {
                  console.log(`AI: ${team.name} bidding ${aiResult.bidAmount} Cr for ${player.name}`);
                  this.acceptBid(team, aiResult.bidAmount);
                  this.aiBidProcessedThisTick = true;
                  break;
                } else {
                  console.debug(`AI: ${team.name} cannot afford ${aiResult.bidAmount} Cr (purse: ${team.purse})`);
                }
              } catch (error) {
                console.debug(`AI bid validation failed for ${team.name}:`, error);
              }
            } else {
              console.debug(`AI: ${team.name} decided not to bid. Reason: ${aiResult.reason}`);
            }
          } catch (error) {
            console.debug(`AI bidding error for ${team.name}:`, error);
          }
        }
      }
      /**
       * End auction as SOLD
       * Sells the player to the leading team (highest bidder)
       * Works regardless of whether user bid or skipped - highest bidder wins
       */
      endAuctionAsSold() {
        if (!this.state.currentPlayer || !this.state.leadingTeam) {
          this.endAuctionAsUnsold("No leading team or player");
          return;
        }
        const player = this.state.currentPlayer;
        const team = this.state.leadingTeam;
        const bidAmount = this.state.currentBid;
        if (bidAmount < player.basePrice) {
          this.endAuctionAsUnsold(
            `Cannot sell below base price. Bid: ${bidAmount}, Base: ${player.basePrice}`
          );
          return;
        }
        console.log(`\u2713 Player ${player.name} SOLD to ${team.name} for ${bidAmount} Cr (highest bidder)`);
        const teamIndex = this.teams.findIndex((t) => t.id === team.id);
        if (teamIndex === -1) {
          throw new Error(`Team ${team.id} not found`);
        }
        this.teams[teamIndex].purse -= bidAmount;
        this.teams[teamIndex].squad.push(player);
        if (defaultOverseasCheck(player)) {
          this.teams[teamIndex].overseasCount++;
        }
        const updatedTeam = this.teams[teamIndex];
        this.updateState({
          status: "sold" /* SOLD */,
          timer: 0,
          leadingTeam: updatedTeam
        });
        this.emit({
          type: "player_sold" /* PLAYER_SOLD */,
          state: this.state,
          data: {
            player,
            team: updatedTeam,
            bidAmount
          }
        });
        this.emit({
          type: "auction_ended" /* AUCTION_ENDED */,
          state: this.state,
          data: { result: "SOLD" }
        });
      }
      /**
       * End auction as UNSOLD
       *
       * @param reason - Reason for unsold status
       */
      endAuctionAsUnsold(reason = "No bids received") {
        const player = this.state.currentPlayer;
        this.updateState({
          status: "unsold" /* UNSOLD */,
          timer: 0,
          leadingTeam: null,
          currentBid: 0
        });
        this.emit({
          type: "player_unsold" /* PLAYER_UNSOLD */,
          state: this.state,
          data: {
            player,
            reason
          }
        });
        this.emit({
          type: "auction_ended" /* AUCTION_ENDED */,
          state: this.state,
          data: { result: "UNSOLD" }
        });
      }
      /**
       * Reset auction to IDLE state (for next player)
       */
      reset() {
        this.stopTimer();
        this.updateState({
          currentPlayer: null,
          currentBid: 0,
          leadingTeam: null,
          timer: 0,
          status: "idle" /* IDLE */
        });
      }
      /**
       * Pause the auction
       */
      pause() {
        if (this.state.status === "bidding" /* BIDDING */) {
          this.stopTimer();
          this.updateState({
            status: "paused" /* PAUSED */
          });
        }
      }
      /**
       * Resume the auction
       */
      resume() {
        if (this.state.status === "paused" /* PAUSED */) {
          this.updateState({
            status: "bidding" /* BIDDING */
          });
          this.startTimer();
        }
      }
      /**
       * Get current auction state (read-only)
       */
      getState() {
        return { ...this.state };
      }
      /**
       * Get auction result status
       * Returns 'SOLD' if player was sold, 'UNSOLD' if unsold, or null if auction is still in progress
       */
      getAuctionResult() {
        if (this.state.status === "sold" /* SOLD */) {
          return "SOLD";
        }
        if (this.state.status === "unsold" /* UNSOLD */) {
          return "UNSOLD";
        }
        return null;
      }
      /**
       * Get all teams (read-only)
       */
      getTeams() {
        return this.teams.map((team) => ({ ...team }));
      }
      /**
       * Get a specific team by ID
       */
      getTeam(teamId) {
        return this.teams.find((t) => t.id === teamId);
      }
      /**
       * Cleanup resources
       */
      destroy() {
        this.stopTimer();
        this.subscriptions.clear();
      }
    };
  }
});

// players.ts
var players_exports = {};
__export(players_exports, {
  players: () => players
});
var players;
var init_players = __esm({
  "players.ts"() {
    players = [
      {
        "id": "sunil-narine",
        "name": "Sunil Narine",
        "role": "All-rounder",
        "basePrice": 2,
        "minPrice": 1.4,
        "maxPrice": 40,
        "rating": 100,
        "popularity": 56,
        "isCapped": true
      },
      {
        "id": "virat-kohli",
        "name": "Virat Kohli",
        "role": "All-rounder",
        "basePrice": 2,
        "minPrice": 1.4,
        "maxPrice": 40,
        "rating": 94,
        "popularity": 27,
        "isCapped": true
      },
      {
        "id": "tristan-stubbs",
        "name": "Tristan Stubbs",
        "role": "All-rounder",
        "basePrice": 2,
        "minPrice": 1.4,
        "maxPrice": 40,
        "rating": 86,
        "popularity": 21,
        "isCapped": true
      },
      {
        "id": "devon-conway",
        "name": "Devon Conway",
        "role": "All-rounder",
        "basePrice": 2,
        "minPrice": 1.2,
        "maxPrice": 30,
        "rating": 76,
        "popularity": 21,
        "isCapped": true
      },
      {
        "id": "andre-russell",
        "name": "Andre Russell",
        "role": "All-rounder",
        "basePrice": 2,
        "minPrice": 1.2,
        "maxPrice": 30,
        "rating": 74,
        "popularity": 50,
        "isCapped": true
      },
      {
        "id": "shashank-singh",
        "name": "Shashank Singh",
        "role": "All-rounder",
        "basePrice": 2,
        "minPrice": 1.2,
        "maxPrice": 30,
        "rating": 72,
        "popularity": 16,
        "isCapped": true
      },
      {
        "id": "ruturaj-gaikwad",
        "name": "Ruturaj Gaikwad",
        "role": "All-rounder",
        "basePrice": 2,
        "minPrice": 1.2,
        "maxPrice": 30,
        "rating": 71,
        "popularity": 24,
        "isCapped": true
      },
      {
        "id": "travis-head",
        "name": "Travis Head",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 69,
        "popularity": 24,
        "isCapped": false
      },
      {
        "id": "riyan-parag",
        "name": "Riyan Parag",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 68,
        "popularity": 19,
        "isCapped": false
      },
      {
        "id": "sam-curran",
        "name": "Sam Curran",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 66,
        "popularity": 44,
        "isCapped": false
      },
      {
        "id": "abhishek-sharma",
        "name": "Abhishek Sharma",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 65,
        "popularity": 22,
        "isCapped": false
      },
      {
        "id": "jasprit-bumrah",
        "name": "Jasprit Bumrah",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 65,
        "popularity": 57,
        "isCapped": false
      },
      {
        "id": "jofra-archer",
        "name": "Jofra Archer",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 65,
        "popularity": 49,
        "isCapped": false
      },
      {
        "id": "harshal-patel",
        "name": "Harshal Patel",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 64,
        "popularity": 47,
        "isCapped": false
      },
      {
        "id": "sanju-samson",
        "name": "Sanju Samson",
        "role": "Wicket-keeper Batsman",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 64,
        "popularity": 18,
        "isCapped": false
      },
      {
        "id": "nicholas-pooran",
        "name": "Nicholas Pooran",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 63,
        "popularity": 17,
        "isCapped": false
      },
      {
        "id": "marcus-stoinis",
        "name": "Marcus Stoinis",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.6,
        "maxPrice": 15,
        "rating": 61,
        "popularity": 28,
        "isCapped": false
      },
      {
        "id": "axar-patel",
        "name": "Axar Patel",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 60,
        "popularity": 34,
        "isCapped": false
      },
      {
        "id": "pat-cummins",
        "name": "Pat Cummins",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 60,
        "popularity": 47,
        "isCapped": false
      },
      {
        "id": "shivam-dube",
        "name": "Shivam Dube",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 59,
        "popularity": 17,
        "isCapped": false
      },
      {
        "id": "varun-chakaravarthy",
        "name": "Varun Chakaravarthy",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 59,
        "popularity": 48,
        "isCapped": false
      },
      {
        "id": "arshdeep-singh",
        "name": "Arshdeep Singh",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 58,
        "popularity": 45,
        "isCapped": false
      },
      {
        "id": "heinrich-klaasen",
        "name": "Heinrich Klaasen",
        "role": "Wicket-keeper Batsman",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 58,
        "popularity": 18,
        "isCapped": false
      },
      {
        "id": "kl-rahul",
        "name": "KL Rahul",
        "role": "Wicket-keeper Batsman",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 58,
        "popularity": 17,
        "isCapped": false
      },
      {
        "id": "t-natarajan",
        "name": "T Natarajan",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 58,
        "popularity": 45,
        "isCapped": false
      },
      {
        "id": "avesh-khan",
        "name": "Avesh Khan",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 57,
        "popularity": 46,
        "isCapped": false
      },
      {
        "id": "mitchell-starc",
        "name": "Mitchell Starc",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 56,
        "popularity": 41,
        "isCapped": false
      },
      {
        "id": "b-sai-sudharsan",
        "name": "B. Sai Sudharsan",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 55,
        "popularity": 22,
        "isCapped": false
      },
      {
        "id": "phil-salt",
        "name": "Phil Salt",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 55,
        "popularity": 15,
        "isCapped": false
      },
      {
        "id": "rishabh-pant",
        "name": "Rishabh Pant",
        "role": "Wicket-keeper Batsman",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 55,
        "popularity": 15,
        "isCapped": false
      },
      {
        "id": "harshit-rana",
        "name": "Harshit Rana",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 54,
        "popularity": 45,
        "isCapped": false
      },
      {
        "id": "mohammad-shami",
        "name": "Mohammad Shami",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 54,
        "popularity": 45,
        "isCapped": false
      },
      {
        "id": "prasidh-krishna",
        "name": "Prasidh Krishna",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 54,
        "popularity": 47,
        "isCapped": false
      },
      {
        "id": "tushar-deshpande",
        "name": "Tushar Deshpande",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 54,
        "popularity": 41,
        "isCapped": false
      },
      {
        "id": "kuldeep-yadav",
        "name": "Kuldeep Yadav",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 53,
        "popularity": 38,
        "isCapped": false
      },
      {
        "id": "ravindra-jadeja",
        "name": "Ravindra Jadeja",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 52,
        "popularity": 28,
        "isCapped": false
      },
      {
        "id": "yuzvendra-chahal",
        "name": "Yuzvendra Chahal",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 52,
        "popularity": 44,
        "isCapped": false
      },
      {
        "id": "rajat-patidar",
        "name": "Rajat Patidar",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 50,
        "popularity": 15,
        "isCapped": false
      },
      {
        "id": "venkatesh-iyer",
        "name": "Venkatesh Iyer",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 50,
        "popularity": 15,
        "isCapped": false
      },
      {
        "id": "faf-du-plessis",
        "name": "Faf du Plessis",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 49,
        "popularity": 16,
        "isCapped": false
      },
      {
        "id": "n-tilak-varma",
        "name": "N. Tilak Varma",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 49,
        "popularity": 15,
        "isCapped": false
      },
      {
        "id": "sandeep-sharma",
        "name": "Sandeep Sharma",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 49,
        "popularity": 42,
        "isCapped": false
      },
      {
        "id": "trent-boult",
        "name": "Trent Boult",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 49,
        "popularity": 40,
        "isCapped": false
      },
      {
        "id": "khaleel-ahmed",
        "name": "Khaleel Ahmed",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 48,
        "popularity": 41,
        "isCapped": false
      },
      {
        "id": "mukesh-kumar",
        "name": "Mukesh Kumar",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 48,
        "popularity": 39,
        "isCapped": false
      },
      {
        "id": "suryakumar-yadav",
        "name": "Suryakumar Yadav",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 48,
        "popularity": 17,
        "isCapped": false
      },
      {
        "id": "matheesha-pathirana",
        "name": "Matheesha Pathirana",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 47,
        "popularity": 29,
        "isCapped": false
      },
      {
        "id": "mohammed-siraj",
        "name": "Mohammed Siraj",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 47,
        "popularity": 37,
        "isCapped": false
      },
      {
        "id": "shubman-gill",
        "name": "Shubman Gill",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 47,
        "popularity": 20,
        "isCapped": false
      },
      {
        "id": "hardik-pandya",
        "name": "Hardik Pandya",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 46,
        "popularity": 33,
        "isCapped": false
      },
      {
        "id": "jake-fraser-mcgurk",
        "name": "Jake Fraser-McGurk",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 46,
        "popularity": 11,
        "isCapped": false
      },
      {
        "id": "jos-buttler",
        "name": "Jos Buttler",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 46,
        "popularity": 23,
        "isCapped": false
      },
      {
        "id": "yashasvi-jaiswal",
        "name": "Yashasvi Jaiswal",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 46,
        "popularity": 21,
        "isCapped": false
      },
      {
        "id": "gerald-coetzee",
        "name": "Gerald Coetzee",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 45,
        "popularity": 31,
        "isCapped": false
      },
      {
        "id": "nitish-kumar-reddy",
        "name": "Nitish Kumar Reddy",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 45,
        "popularity": 19,
        "isCapped": false
      },
      {
        "id": "rohit-sharma",
        "name": "Rohit Sharma",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 45,
        "popularity": 20,
        "isCapped": false
      },
      {
        "id": "yash-dayal",
        "name": "Yash Dayal",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 45,
        "popularity": 37,
        "isCapped": false
      },
      {
        "id": "shahbaz-ahamad",
        "name": "Shahbaz Ahamad",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 43,
        "popularity": 26,
        "isCapped": false
      },
      {
        "id": "will-jacks",
        "name": "Will Jacks",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 42,
        "popularity": 18,
        "isCapped": false
      },
      {
        "id": "yash-thakur",
        "name": "Yash Thakur",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 42,
        "popularity": 37,
        "isCapped": false
      },
      {
        "id": "shreyas-iyer",
        "name": "Shreyas Iyer",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.5,
        "maxPrice": 12,
        "rating": 41,
        "popularity": 14,
        "isCapped": false
      },
      {
        "id": "mohit-sharma",
        "name": "Mohit Sharma",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 40,
        "popularity": 32,
        "isCapped": false
      },
      {
        "id": "rashid-khan",
        "name": "Rashid Khan",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 40,
        "popularity": 28,
        "isCapped": false
      },
      {
        "id": "kagiso-rabada",
        "name": "Kagiso Rabada",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 39,
        "popularity": 28,
        "isCapped": false
      },
      {
        "id": "bhuvneshwar-kumar",
        "name": "Bhuvneshwar Kumar",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 37,
        "popularity": 30,
        "isCapped": false
      },
      {
        "id": "ravichandran-ashwin",
        "name": "Ravichandran Ashwin",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 37,
        "popularity": 27,
        "isCapped": false
      },
      {
        "id": "sai-kishore",
        "name": "Sai Kishore",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 37,
        "popularity": 17,
        "isCapped": false
      },
      {
        "id": "harpreet-brar",
        "name": "Harpreet Brar",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 36,
        "popularity": 22,
        "isCapped": false
      },
      {
        "id": "rahul-chahar",
        "name": "Rahul Chahar",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 36,
        "popularity": 25,
        "isCapped": false
      },
      {
        "id": "ravi-bishnoi",
        "name": "Ravi Bishnoi",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 36,
        "popularity": 27,
        "isCapped": false
      },
      {
        "id": "abishek-porel",
        "name": "Abishek Porel",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 35,
        "popularity": 14,
        "isCapped": false
      },
      {
        "id": "josh-hazlewood",
        "name": "Josh Hazlewood",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 35,
        "popularity": 27,
        "isCapped": false
      },
      {
        "id": "krunal-pandya",
        "name": "Krunal Pandya",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 35,
        "popularity": 22,
        "isCapped": false
      },
      {
        "id": "mohsin-khan",
        "name": "Mohsin Khan",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 35,
        "popularity": 25,
        "isCapped": false
      },
      {
        "id": "vaibhav-arora",
        "name": "Vaibhav Arora",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 35,
        "popularity": 27,
        "isCapped": false
      },
      {
        "id": "ishant-sharma",
        "name": "Ishant Sharma",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 33,
        "popularity": 25,
        "isCapped": false
      },
      {
        "id": "karn-sharma",
        "name": "Karn Sharma",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 33,
        "popularity": 19,
        "isCapped": false
      },
      {
        "id": "prabhsimran-singh",
        "name": "Prabhsimran Singh",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 33,
        "popularity": 14,
        "isCapped": false
      },
      {
        "id": "rachin-ravindra",
        "name": "Rachin Ravindra",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 33,
        "popularity": 9,
        "isCapped": false
      },
      {
        "id": "ishan-kishan",
        "name": "Ishan Kishan",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 32,
        "popularity": 13,
        "isCapped": false
      },
      {
        "id": "ayush-badoni",
        "name": "Ayush Badoni",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 31,
        "popularity": 12,
        "isCapped": false
      },
      {
        "id": "dhruv-jurel",
        "name": "Dhruv Jurel",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 31,
        "popularity": 11,
        "isCapped": false
      },
      {
        "id": "glenn-maxwell",
        "name": "Glenn Maxwell",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 31,
        "popularity": 18,
        "isCapped": false
      },
      {
        "id": "lockie-ferguson",
        "name": "Lockie Ferguson",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 31,
        "popularity": 22,
        "isCapped": false
      },
      {
        "id": "noor-ahmad",
        "name": "Noor Ahmad",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 31,
        "popularity": 21,
        "isCapped": false
      },
      {
        "id": "wanindu-hasaranga",
        "name": "Wanindu Hasaranga",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 31,
        "popularity": 23,
        "isCapped": false
      },
      {
        "id": "ms-dhoni",
        "name": "MS Dhoni",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 30,
        "popularity": 10,
        "isCapped": false
      },
      {
        "id": "mayank-yadav",
        "name": "Mayank Yadav",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 30,
        "popularity": 16,
        "isCapped": false
      },
      {
        "id": "quinton-de-kock",
        "name": "Quinton de Kock",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 30,
        "popularity": 11,
        "isCapped": false
      },
      {
        "id": "rasikh-dar",
        "name": "Rasikh Dar",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 30,
        "popularity": 23,
        "isCapped": false
      },
      {
        "id": "swapnil-singh",
        "name": "Swapnil Singh",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 30,
        "popularity": 16,
        "isCapped": false
      },
      {
        "id": "jaydev-unadkat",
        "name": "Jaydev Unadkat",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 29,
        "popularity": 22,
        "isCapped": false
      },
      {
        "id": "mayank-markande",
        "name": "Mayank Markande",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 27,
        "popularity": 20,
        "isCapped": false
      },
      {
        "id": "moeen-ali",
        "name": "Moeen Ali",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 27,
        "popularity": 11,
        "isCapped": false
      },
      {
        "id": "nuwan-thushara",
        "name": "Nuwan Thushara",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 27,
        "popularity": 20,
        "isCapped": false
      },
      {
        "id": "ramandeep-singh",
        "name": "Ramandeep Singh",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 26,
        "popularity": 10,
        "isCapped": false
      },
      {
        "id": "aiden-markram",
        "name": "Aiden Markram",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 25,
        "popularity": 10,
        "isCapped": false
      },
      {
        "id": "liam-livingstone",
        "name": "Liam Livingstone",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 25,
        "popularity": 12,
        "isCapped": false
      },
      {
        "id": "tim-david",
        "name": "Tim David",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 25,
        "popularity": 11,
        "isCapped": false
      },
      {
        "id": "abdul-samad",
        "name": "Abdul Samad",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 24,
        "popularity": 12,
        "isCapped": false
      },
      {
        "id": "david-miller",
        "name": "David Miller",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 24,
        "popularity": 9,
        "isCapped": false
      },
      {
        "id": "kuldeep-sen",
        "name": "Kuldeep Sen",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 24,
        "popularity": 14,
        "isCapped": false
      },
      {
        "id": "anrich-nortje",
        "name": "Anrich Nortje",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 23,
        "popularity": 17,
        "isCapped": false
      },
      {
        "id": "ashutosh-sharma",
        "name": "Ashutosh Sharma",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 23,
        "popularity": 9,
        "isCapped": false
      },
      {
        "id": "deepak-hooda",
        "name": "Deepak Hooda",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 23,
        "popularity": 8,
        "isCapped": false
      },
      {
        "id": "jitesh-sharma",
        "name": "Jitesh Sharma",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 23,
        "popularity": 11,
        "isCapped": false
      },
      {
        "id": "shahrukh-khan",
        "name": "Shahrukh Khan",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 23,
        "popularity": 6,
        "isCapped": false
      },
      {
        "id": "darshan-nalkande",
        "name": "Darshan Nalkande",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 22,
        "popularity": 8,
        "isCapped": false
      },
      {
        "id": "simarjeet-singh",
        "name": "Simarjeet Singh",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 22,
        "popularity": 12,
        "isCapped": false
      },
      {
        "id": "angkrish-raghuvanshi",
        "name": "Angkrish Raghuvanshi",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 21,
        "popularity": 8,
        "isCapped": false
      },
      {
        "id": "deepak-chahar",
        "name": "Deepak Chahar",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 21,
        "popularity": 14,
        "isCapped": false
      },
      {
        "id": "glenn-phillips",
        "name": "Glenn Phillips",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 21,
        "popularity": 5,
        "isCapped": false
      },
      {
        "id": "kumar-kartikeya-singh",
        "name": "Kumar Kartikeya Singh",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 21,
        "popularity": 14,
        "isCapped": false
      },
      {
        "id": "lungi-ngidi",
        "name": "Lungi Ngidi",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 21,
        "popularity": 12,
        "isCapped": false
      },
      {
        "id": "naman-dhir",
        "name": "Naman Dhir",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 21,
        "popularity": 6,
        "isCapped": false
      },
      {
        "id": "rahul-tewatia",
        "name": "Rahul Tewatia",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.4,
        "maxPrice": 8,
        "rating": 21,
        "popularity": 10,
        "isCapped": false
      },
      {
        "id": "akash-singh",
        "name": "Akash Singh",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 20,
        "popularity": 13,
        "isCapped": false
      },
      {
        "id": "azmatullah-omarzai",
        "name": "Azmatullah Omarzai",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 20,
        "popularity": 12,
        "isCapped": false
      },
      {
        "id": "rinku-singh",
        "name": "Rinku Singh",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 20,
        "popularity": 10,
        "isCapped": false
      },
      {
        "id": "akash-madhwal",
        "name": "Akash Madhwal",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 19,
        "popularity": 13,
        "isCapped": false
      },
      {
        "id": "fazalhaq-farooqi",
        "name": "Fazalhaq Farooqi",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 19,
        "popularity": 10,
        "isCapped": false
      },
      {
        "id": "mohd-arshad-khan",
        "name": "Mohd. Arshad Khan",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 19,
        "popularity": 6,
        "isCapped": false
      },
      {
        "id": "vyshak-vijay-kumar",
        "name": "Vyshak Vijay Kumar",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 19,
        "popularity": 10,
        "isCapped": false
      },
      {
        "id": "ajinkya-rahane",
        "name": "Ajinkya Rahane",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 18,
        "popularity": 11,
        "isCapped": false
      },
      {
        "id": "rahul-tripathi",
        "name": "Rahul Tripathi",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 18,
        "popularity": 6,
        "isCapped": false
      },
      {
        "id": "romario-shepherd",
        "name": "Romario Shepherd",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 18,
        "popularity": 6,
        "isCapped": false
      },
      {
        "id": "shreyas-gopal",
        "name": "Shreyas Gopal",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 18,
        "popularity": 8,
        "isCapped": false
      },
      {
        "id": "spencer-johnson",
        "name": "Spencer Johnson",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 18,
        "popularity": 11,
        "isCapped": false
      },
      {
        "id": "mahipal-lomror",
        "name": "Mahipal Lomror",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 17,
        "popularity": 8,
        "isCapped": false
      },
      {
        "id": "mujeeb-ur-rahman",
        "name": "Mujeeb Ur Rahman",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 17,
        "popularity": 5,
        "isCapped": false
      },
      {
        "id": "rajvardhan-hangargekar",
        "name": "Rajvardhan Hangargekar",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 17,
        "popularity": 7,
        "isCapped": false
      },
      {
        "id": "reece-topley",
        "name": "Reece Topley",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 17,
        "popularity": 10,
        "isCapped": false
      },
      {
        "id": "shimron-hetmyer",
        "name": "Shimron Hetmyer",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 17,
        "popularity": 8,
        "isCapped": false
      },
      {
        "id": "rovman-powell",
        "name": "Rovman Powell",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 16,
        "popularity": 7,
        "isCapped": false
      },
      {
        "id": "marco-jansen",
        "name": "Marco Jansen",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 15,
        "popularity": 4,
        "isCapped": false
      },
      {
        "id": "mitchell-santner",
        "name": "Mitchell Santner",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 15,
        "popularity": 6,
        "isCapped": false
      },
      {
        "id": "nehal-wadhera",
        "name": "Nehal Wadhera",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 15,
        "popularity": 5,
        "isCapped": false
      },
      {
        "id": "anshul-kamboj",
        "name": "Anshul Kamboj",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 14,
        "popularity": 6,
        "isCapped": false
      },
      {
        "id": "maheesh-theekshana",
        "name": "Maheesh Theekshana",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 14,
        "popularity": 7,
        "isCapped": false
      },
      {
        "id": "pravin-dubey",
        "name": "Pravin Dubey",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 14,
        "popularity": 3,
        "isCapped": false
      },
      {
        "id": "manish-pandey",
        "name": "Manish Pandey",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 13,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "mitchell-marsh",
        "name": "Mitchell Marsh",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 13,
        "popularity": 5,
        "isCapped": false
      },
      {
        "id": "anuj-rawat",
        "name": "Anuj Rawat",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 12,
        "popularity": 4,
        "isCapped": false
      },
      {
        "id": "nathan-ellis",
        "name": "Nathan Ellis",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 12,
        "popularity": 3,
        "isCapped": false
      },
      {
        "id": "rahmanullah-gurbaz",
        "name": "Rahmanullah Gurbaz",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 12,
        "popularity": 2,
        "isCapped": false
      },
      {
        "id": "adam-zampa",
        "name": "Adam Zampa",
        "role": "Bowler",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 11,
        "popularity": 6,
        "isCapped": false
      },
      {
        "id": "vijay-shankar",
        "name": "Vijay Shankar",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 11,
        "popularity": 5,
        "isCapped": false
      },
      {
        "id": "yudhvir-singh",
        "name": "Yudhvir Singh",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 11,
        "popularity": 3,
        "isCapped": false
      },
      {
        "id": "m-siddharth",
        "name": "M Siddharth",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 10,
        "popularity": 4,
        "isCapped": false
      },
      {
        "id": "sameer-rizvi",
        "name": "Sameer Rizvi",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 10,
        "popularity": 5,
        "isCapped": false
      },
      {
        "id": "jayant-yadav",
        "name": "Jayant Yadav",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 9,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "kulwant-khejroliya",
        "name": "Kulwant Khejroliya",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 9,
        "popularity": 3,
        "isCapped": false
      },
      {
        "id": "akash-deep",
        "name": "Akash Deep",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 8,
        "popularity": 3,
        "isCapped": false
      },
      {
        "id": "atharva-taide",
        "name": "Atharva Taide",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 8,
        "popularity": 2,
        "isCapped": false
      },
      {
        "id": "devdutt-padikkal",
        "name": "Devdutt Padikkal",
        "role": "All-rounder",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 8,
        "popularity": 4,
        "isCapped": false
      },
      {
        "id": "washington-sundar",
        "name": "Washington Sundar",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 8,
        "popularity": 3,
        "isCapped": false
      },
      {
        "id": "kamlesh-nagarkoti",
        "name": "Kamlesh Nagarkoti",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 7,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "kwena-maphaka",
        "name": "Kwena Maphaka",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 7,
        "popularity": 3,
        "isCapped": false
      },
      {
        "id": "shubham-dubey",
        "name": "Shubham Dubey",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 7,
        "popularity": 3,
        "isCapped": false
      },
      {
        "id": "abhinav-manohar",
        "name": "Abhinav Manohar",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 5,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "anukul-roy",
        "name": "Anukul Roy",
        "role": "Bowler",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 5,
        "popularity": 2,
        "isCapped": false
      },
      {
        "id": "karun-nair",
        "name": "Karun Nair",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 5,
        "popularity": 2,
        "isCapped": false
      },
      {
        "id": "suyash-sharma",
        "name": "Suyash Sharma",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 5,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "vishnu-vinod",
        "name": "Vishnu Vinod",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 5,
        "popularity": 2,
        "isCapped": false
      },
      {
        "id": "arjun-tendulkar",
        "name": "Arjun Tendulkar",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 4,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "donovan-ferreira",
        "name": "Donovan Ferreira",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 4,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "kumar-kushagra",
        "name": "Kumar Kushagra",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 4,
        "popularity": 2,
        "isCapped": false
      },
      {
        "id": "nitish-rana",
        "name": "Nitish Rana",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 4,
        "popularity": 2,
        "isCapped": false
      },
      {
        "id": "shamar-joseph",
        "name": "Shamar Joseph",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 4,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "arshin-kulkarni",
        "name": "Arshin Kulkarni",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 3,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "dushmantha-chameera",
        "name": "Dushmantha Chameera",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 3,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "manav-suthar",
        "name": "Manav Suthar",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 3,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "sherfane-rutherford",
        "name": "Sherfane Rutherford",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 3,
        "popularity": 2,
        "isCapped": false
      },
      {
        "id": "umran-malik",
        "name": "Umran Malik",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 3,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "mukesh-choudhary",
        "name": "Mukesh Choudhary",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 2,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "raj-angad-bawa",
        "name": "Raj Angad Bawa",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 2,
        "popularity": 1,
        "isCapped": false
      },
      {
        "id": "sachin-baby",
        "name": "Sachin Baby",
        "role": "Batsman",
        "basePrice": 1,
        "minPrice": 0.3,
        "maxPrice": 5,
        "rating": 1,
        "popularity": 1,
        "isCapped": false
      }
    ];
  }
});

// auction-manager.ts
var auction_manager_exports = {};
__export(auction_manager_exports, {
  AuctionManager: () => AuctionManager,
  createAuctionManager: () => createAuctionManager,
  createAuctionManagerSync: () => createAuctionManagerSync,
  loadPlayers: () => loadPlayers,
  loadPlayersSync: () => loadPlayersSync
});
async function loadPlayers() {
  try {
    const playersModule = await Promise.resolve().then(() => (init_players(), players_exports));
    return playersModule.players;
  } catch (error) {
    console.error("Error loading players:", error);
    throw new Error(
      "Failed to load players. Make sure players.ts exists and was generated correctly. Run: npm run convert"
    );
  }
}
function loadPlayersSync() {
  try {
    const playersModule = (init_players(), __toCommonJS(players_exports));
    return playersModule.players;
  } catch (error) {
    console.error("Error loading players:", error);
    throw new Error(
      "Failed to load players. Make sure players.ts exists and was generated correctly. Run: npm run convert"
    );
  }
}
async function createAuctionManager(engine2, config = {}) {
  const players2 = await loadPlayers();
  return new AuctionManager(engine2, players2, config);
}
function createAuctionManagerSync(engine2, players2, config = {}) {
  return new AuctionManager(engine2, players2, config);
}
var AuctionManager;
var init_auction_manager = __esm({
  "auction-manager.ts"() {
    init_auction_engine();
    init_types();
    init_auction_pool();
    AuctionManager = class {
      /**
       * Creates a new auction manager
       *
       * @param engine - Auction engine instance
       * @param players - Array of players to auction
       * @param config - Optional configuration
       */
      constructor(engine2, players2, config = {}) {
        this.currentPlayerIndex = 0;
        this.isRunning = false;
        this.subscriptions = /* @__PURE__ */ new Set();
        this.auctionedPlayerIds = /* @__PURE__ */ new Set();
        this.engine = engine2;
        this.players = [...players2];
        this.refreshAuctionablePlayers();
        this.config = {
          autoProceed: config.autoProceed ?? false,
          proceedDelay: config.proceedDelay ?? 1e3
        };
        this.stats = {
          totalPlayers: this.players.length,
          playersAuctioned: 0,
          playersSold: 0,
          playersUnsold: 0,
          playersSkipped: this.players.length - this.auctionablePlayers.length,
          totalRevenue: 0
        };
        this.engine.subscribe((event) => {
          this.handleEngineEvent(event);
        });
      }
      /**
       * Subscribe to auction manager events
       */
      subscribe(callback) {
        this.subscriptions.add(callback);
        return () => {
          this.subscriptions.delete(callback);
        };
      }
      /**
       * Emit event to subscribers
       */
      emit(event) {
        this.subscriptions.forEach((callback) => {
          try {
            callback(event);
          } catch (error) {
            console.error("Error in subscription callback:", error);
          }
        });
      }
      /**
       * Handle events from the auction engine
       */
      handleEngineEvent(event) {
        this.emit(event);
        if (event.type === "auction_ended" /* AUCTION_ENDED */) {
          this.handleAuctionEnded(event);
        }
      }
      /**
       * Handle auction ended event
       */
      handleAuctionEnded(event) {
        const result = event.data?.result;
        const bidAmount = event.data?.bidAmount || 0;
        if (result === "SOLD") {
          this.stats.playersSold++;
          this.stats.totalRevenue += bidAmount;
        } else if (result === "UNSOLD") {
          this.stats.playersUnsold++;
        }
        if (this.config.autoProceed && this.isRunning) {
          setTimeout(() => {
            this.proceedToNextPlayer();
          }, this.config.proceedDelay);
        }
      }
      /**
       * Refresh auctionable players list (excludes retained players)
       */
      refreshAuctionablePlayers() {
        const teams3 = this.engine.getTeams();
        this.auctionablePlayers = getAuctionablePlayers(this.players, teams3);
      }
      /**
       * Get the next available player (not retained, not already auctioned)
       */
      getNextAvailablePlayer() {
        this.refreshAuctionablePlayers();
        const teams3 = this.engine.getTeams();
        while (this.currentPlayerIndex < this.auctionablePlayers.length) {
          const player = this.auctionablePlayers[this.currentPlayerIndex];
          this.currentPlayerIndex++;
          if (isPlayerRetained(player, teams3)) {
            this.stats.playersSkipped++;
            this.emit({
              type: "player_set" /* PLAYER_SET */,
              state: this.engine.getState(),
              data: {
                player,
                skipped: true,
                reason: `Player "${player.name}" is retained and cannot be auctioned`
              }
            });
            continue;
          }
          if (!isPlayerAvailableForAuction(player, teams3)) {
            this.stats.playersSkipped++;
            this.emit({
              type: "player_set" /* PLAYER_SET */,
              state: this.engine.getState(),
              data: {
                player,
                skipped: true,
                reason: "Player is no longer available for auction"
              }
            });
            continue;
          }
          const duplicateCheck = checkForDuplicate(
            player,
            teams3,
            this.auctionedPlayerIds
          );
          if (duplicateCheck.isDuplicate) {
            this.stats.playersSkipped++;
            this.emit({
              type: "player_set" /* PLAYER_SET */,
              state: this.engine.getState(),
              data: {
                player,
                skipped: true,
                reason: duplicateCheck.reason || "Duplicate player"
              }
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
      startNextPlayer() {
        const state = this.engine.getState();
        if (state.status !== "idle" /* IDLE */) {
          this.engine.reset();
        }
        const player = this.getNextAvailablePlayer();
        if (!player) {
          this.isRunning = false;
          this.emit({
            type: "auction_ended" /* AUCTION_ENDED */,
            state: this.engine.getState(),
            data: {
              result: "COMPLETE",
              stats: this.getStats()
            }
          });
          return;
        }
        try {
          const teams3 = this.engine.getTeams();
          if (isPlayerRetained(player, teams3)) {
            const retainingTeam = teams3.find(
              (t) => t.retainedPlayers.some((p) => p.id === player.id)
            );
            this.stats.playersSkipped++;
            this.emit({
              type: "error" /* ERROR */,
              state: this.engine.getState(),
              error: `CRITICAL: Player "${player.name}" is retained by ${retainingTeam?.name || "a team"} and cannot be auctioned. Skipping.`
            });
            setTimeout(() => this.startNextPlayer(), 100);
            return;
          }
          if (!isPlayerAvailableForAuction(player, teams3)) {
            this.stats.playersSkipped++;
            this.emit({
              type: "error" /* ERROR */,
              state: this.engine.getState(),
              error: `Player "${player.name}" is not available for auction (retained or in squad). Skipping.`
            });
            setTimeout(() => this.startNextPlayer(), 100);
            return;
          }
          validatePlayerForAuction(player, teams3, this.auctionedPlayerIds);
          this.engine.setCurrentPlayer(player);
          this.stats.playersAuctioned++;
          this.auctionedPlayerIds.add(player.id);
        } catch (error) {
          console.error("Error setting current player:", error);
          this.stats.playersSkipped++;
          this.emit({
            type: "error" /* ERROR */,
            state: this.engine.getState(),
            error: error.message || "Failed to set current player"
          });
          this.engine.reset();
          setTimeout(() => this.startNextPlayer(), 100);
        }
      }
      /**
       * Proceed to the next player
       * Resets auction state and starts next player auction
       */
      proceedToNextPlayer() {
        if (!this.isRunning) {
          return;
        }
        this.engine.reset();
        this.startNextPlayer();
      }
      /**
       * Start the auction process
       * Begins auctioning players sequentially
       */
      start() {
        if (this.isRunning) {
          console.warn("Auction is already running");
          return;
        }
        this.isRunning = true;
        this.currentPlayerIndex = 0;
        this.emit({
          type: "state_changed" /* STATE_CHANGED */,
          state: this.engine.getState(),
          data: {
            action: "Auction started",
            totalPlayers: this.stats.totalPlayers
          }
        });
        this.startNextPlayer();
      }
      /**
       * Stop the auction process
       */
      stop() {
        this.isRunning = false;
        this.engine.pause();
        this.emit({
          type: "state_changed" /* STATE_CHANGED */,
          state: this.engine.getState(),
          data: {
            action: "Auction stopped"
          }
        });
      }
      /**
       * Pause the current auction
       */
      pause() {
        this.engine.pause();
      }
      /**
       * Resume the current auction
       */
      resume() {
        this.engine.resume();
      }
      /**
       * Get current auction statistics
       */
      getStats() {
        return { ...this.stats };
      }
      /**
       * Get remaining players count
       */
      getRemainingPlayersCount() {
        return this.auctionablePlayers.length - this.currentPlayerIndex;
      }
      /**
       * Get auctionable players (excluding retained players)
       */
      getAuctionablePlayers() {
        return [...this.auctionablePlayers];
      }
      /**
       * Get auction pool statistics
       */
      getAuctionPoolStats() {
        const teams3 = this.engine.getTeams();
        return getAuctionPoolStats(this.players, teams3);
      }
      /**
       * Get current player index
       */
      getCurrentPlayerIndex() {
        return this.currentPlayerIndex;
      }
      /**
       * Check if auction is running
       */
      isAuctionRunning() {
        return this.isRunning;
      }
      /**
       * Get the auction engine instance
       */
      getEngine() {
        return this.engine;
      }
      /**
       * Reset auction manager state
       */
      reset() {
        this.isRunning = false;
        this.currentPlayerIndex = 0;
        this.auctionedPlayerIds.clear();
        this.refreshAuctionablePlayers();
        this.stats = {
          totalPlayers: this.players.length,
          playersAuctioned: 0,
          playersSold: 0,
          playersUnsold: 0,
          playersSkipped: this.players.length - this.auctionablePlayers.length,
          totalRevenue: 0
        };
        this.engine.reset();
      }
    };
  }
});

// teams.ts
var teams_exports = {};
__export(teams_exports, {
  getInitialTeams: () => getInitialTeams,
  getTeamById: () => getTeamById,
  getTeamByName: () => getTeamByName,
  teams: () => teams
});
function getTeamById(id) {
  return teams.find((team) => team.id === id);
}
function getTeamByName(name) {
  return teams.find((team) => team.name === name);
}
function getInitialTeams() {
  return teams.map((team) => ({
    ...team,
    squad: [...team.squad],
    retainedPlayers: [...team.retainedPlayers],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS }
    // Always use default role needs
  }));
}
var DEFAULT_ROLE_NEEDS, teams;
var init_teams = __esm({
  "teams.ts"() {
    init_types();
    DEFAULT_ROLE_NEEDS = {
      ["Batsman" /* BATSMAN */]: 6,
      ["Bowler" /* BOWLER */]: 6,
      ["All-rounder" /* ALL_ROUNDER */]: 2,
      ["Wicket-keeper" /* WICKET_KEEPER */]: 1,
      ["Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */]: 0
      // Can count towards wicket-keeper
    };
    teams = [
      {
        id: "mi",
        name: "Mumbai Indians",
        purse: 100,
        aggression: 70,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      },
      {
        id: "csk",
        name: "Chennai Super Kings",
        purse: 100,
        aggression: 65,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      },
      {
        id: "rcb",
        name: "Royal Challengers Bangalore",
        purse: 100,
        aggression: 75,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      },
      {
        id: "kkr",
        name: "Kolkata Knight Riders",
        purse: 100,
        aggression: 60,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      },
      {
        id: "dc",
        name: "Delhi Capitals",
        purse: 100,
        aggression: 65,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      },
      {
        id: "srh",
        name: "Sunrisers Hyderabad",
        purse: 100,
        aggression: 68,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      },
      {
        id: "rr",
        name: "Rajasthan Royals",
        purse: 100,
        aggression: 72,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      },
      {
        id: "pbks",
        name: "Punjab Kings",
        purse: 100,
        aggression: 70,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      },
      {
        id: "gt",
        name: "Gujarat Titans",
        purse: 100,
        aggression: 68,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      },
      {
        id: "lsg",
        name: "Lucknow Super Giants",
        purse: 100,
        aggression: 70,
        overseasCount: 0,
        squad: [],
        retainedPlayers: [],
        roleNeeds: { ...DEFAULT_ROLE_NEEDS }
      }
    ];
  }
});

// ui.ts
init_auction_engine();
init_auction_manager();
init_types();
init_bid_utils();

// retention.ts
var RetentionValidationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "RetentionValidationError";
  }
};
var CAPPED_RETENTION_COSTS = [18, 14, 8, 4];
var UNCAPPED_RETENTION_COST = 4;
var MAX_TOTAL_RETENTIONS = 6;
var MAX_CAPPED_RETENTIONS = 4;
var MAX_UNCAPPED_RETENTIONS = 2;
function validateRetentions(retainedPlayers, auctionType = "mega" /* MEGA */) {
  const cappedPlayers = retainedPlayers.filter((player) => player.isCapped);
  const uncappedPlayers = retainedPlayers.filter((player) => !player.isCapped);
  if (auctionType === "mega" /* MEGA */) {
    if (retainedPlayers.length > MAX_TOTAL_RETENTIONS) {
      throw new RetentionValidationError(
        `Maximum ${MAX_TOTAL_RETENTIONS} retentions allowed in Mega Auction. Found ${retainedPlayers.length} retentions.`
      );
    }
    if (cappedPlayers.length > MAX_CAPPED_RETENTIONS) {
      throw new RetentionValidationError(
        `Maximum ${MAX_CAPPED_RETENTIONS} capped player retentions allowed in Mega Auction. Found ${cappedPlayers.length} capped players.`
      );
    }
    if (uncappedPlayers.length > MAX_UNCAPPED_RETENTIONS) {
      throw new RetentionValidationError(
        `Maximum ${MAX_UNCAPPED_RETENTIONS} uncapped player retentions allowed in Mega Auction. Found ${uncappedPlayers.length} uncapped players.`
      );
    }
  }
  let totalCost = 0;
  cappedPlayers.forEach((player, index) => {
    if (index < CAPPED_RETENTION_COSTS.length) {
      totalCost += CAPPED_RETENTION_COSTS[index];
    } else {
      throw new RetentionValidationError(
        `Invalid capped player retention index: ${index}. Maximum allowed is ${MAX_CAPPED_RETENTIONS}.`
      );
    }
  });
  totalCost += uncappedPlayers.length * UNCAPPED_RETENTION_COST;
  return totalCost;
}

// previous-season-squads.ts
init_types();
function generatePlayerId(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
function createPlayer(name, role, isCapped, rating = 70, popularity = 50) {
  const id = generatePlayerId(name);
  const basePrice = isCapped ? 2 : 1;
  const minPrice = rating * 0.1;
  const maxPrice = rating * 0.25;
  return {
    id,
    name,
    role,
    basePrice,
    minPrice,
    maxPrice,
    rating,
    popularity,
    isCapped
  };
}
var previousSeasonSquads = {
  // Mumbai Indians
  mi: [
    createPlayer("Rohit Sharma", "Batsman" /* BATSMAN */, true, 88, 95),
    createPlayer("Jasprit Bumrah", "Bowler" /* BOWLER */, true, 92, 90),
    createPlayer("Suryakumar Yadav", "Batsman" /* BATSMAN */, true, 85, 85),
    createPlayer("Hardik Pandya", "All-rounder" /* ALL_ROUNDER */, true, 87, 88),
    createPlayer("Ishan Kishan", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 82, 80),
    createPlayer("Tilak Varma", "Batsman" /* BATSMAN */, false, 75, 70),
    createPlayer("Tim David", "Batsman" /* BATSMAN */, true, 80, 75),
    createPlayer("Cameron Green", "All-rounder" /* ALL_ROUNDER */, true, 84, 78),
    createPlayer("Jofra Archer", "Bowler" /* BOWLER */, true, 89, 85),
    createPlayer("Piyush Chawla", "Bowler" /* BOWLER */, true, 72, 65),
    createPlayer("Nehal Wadhera", "Batsman" /* BATSMAN */, false, 68, 55),
    createPlayer("Akash Madhwal", "Bowler" /* BOWLER */, false, 70, 60),
    createPlayer("Kumar Kartikeya", "Bowler" /* BOWLER */, false, 69, 58),
    createPlayer("Hrithik Shokeen", "All-rounder" /* ALL_ROUNDER */, false, 65, 50),
    createPlayer("Ramandeep Singh", "All-rounder" /* ALL_ROUNDER */, false, 67, 52),
    createPlayer("Shams Mulani", "Bowler" /* BOWLER */, false, 66, 48),
    createPlayer("Vishnu Vinod", "Wicket-keeper" /* WICKET_KEEPER */, false, 64, 45)
  ],
  // Chennai Super Kings
  csk: [
    createPlayer("MS Dhoni", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 85, 98),
    createPlayer("Ruturaj Gaikwad", "Batsman" /* BATSMAN */, true, 83, 82),
    createPlayer("Devon Conway", "Batsman" /* BATSMAN */, true, 86, 80),
    createPlayer("Ravindra Jadeja", "All-rounder" /* ALL_ROUNDER */, true, 88, 90),
    createPlayer("Shivam Dube", "All-rounder" /* ALL_ROUNDER */, true, 78, 72),
    createPlayer("Moeen Ali", "All-rounder" /* ALL_ROUNDER */, true, 81, 75),
    createPlayer("Deepak Chahar", "Bowler" /* BOWLER */, true, 84, 78),
    createPlayer("Matheesha Pathirana", "Bowler" /* BOWLER */, true, 79, 70),
    createPlayer("Tushar Deshpande", "Bowler" /* BOWLER */, false, 72, 65),
    createPlayer("Maheesh Theekshana", "Bowler" /* BOWLER */, true, 77, 68),
    createPlayer("Ajinkya Rahane", "Batsman" /* BATSMAN */, true, 80, 85),
    createPlayer("Ambati Rayudu", "Batsman" /* BATSMAN */, true, 76, 70),
    createPlayer("Mitchell Santner", "All-rounder" /* ALL_ROUNDER */, true, 78, 72),
    createPlayer("Subhranshu Senapati", "Batsman" /* BATSMAN */, false, 68, 55),
    createPlayer("Rajvardhan Hangargekar", "All-rounder" /* ALL_ROUNDER */, false, 70, 60),
    createPlayer("Simarjeet Singh", "Bowler" /* BOWLER */, false, 69, 58),
    createPlayer("Prashant Solanki", "Bowler" /* BOWLER */, false, 67, 52)
  ],
  // Royal Challengers Bangalore
  rcb: [
    createPlayer("Virat Kohli", "Batsman" /* BATSMAN */, true, 90, 98),
    createPlayer("Faf du Plessis", "Batsman" /* BATSMAN */, true, 87, 88),
    createPlayer("Glenn Maxwell", "All-rounder" /* ALL_ROUNDER */, true, 86, 85),
    createPlayer("Mohammed Siraj", "Bowler" /* BOWLER */, true, 85, 82),
    createPlayer("Dinesh Karthik", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 78, 80),
    createPlayer("Harshal Patel", "Bowler" /* BOWLER */, true, 82, 78),
    createPlayer("Wanindu Hasaranga", "All-rounder" /* ALL_ROUNDER */, true, 84, 80),
    createPlayer("Josh Hazlewood", "Bowler" /* BOWLER */, true, 88, 85),
    createPlayer("Mahipal Lomror", "Batsman" /* BATSMAN */, false, 73, 65),
    createPlayer("Anuj Rawat", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, false, 70, 62),
    createPlayer("Shahbaz Ahmed", "All-rounder" /* ALL_ROUNDER */, false, 74, 68),
    createPlayer("Karn Sharma", "Bowler" /* BOWLER */, true, 71, 60),
    createPlayer("Suyash Prabhudessai", "Batsman" /* BATSMAN */, false, 69, 58),
    createPlayer("David Willey", "All-rounder" /* ALL_ROUNDER */, true, 79, 72),
    createPlayer("Siddarth Kaul", "Bowler" /* BOWLER */, true, 72, 65),
    createPlayer("Akash Deep", "Bowler" /* BOWLER */, false, 71, 60),
    createPlayer("Rajan Kumar", "Bowler" /* BOWLER */, false, 68, 55)
  ],
  // Kolkata Knight Riders
  kkr: [
    createPlayer("Shreyas Iyer", "Batsman" /* BATSMAN */, true, 85, 85),
    createPlayer("Andre Russell", "All-rounder" /* ALL_ROUNDER */, true, 89, 90),
    createPlayer("Sunil Narine", "All-rounder" /* ALL_ROUNDER */, true, 83, 88),
    createPlayer("Varun Chakaravarthy", "Bowler" /* BOWLER */, true, 81, 75),
    createPlayer("Venkatesh Iyer", "All-rounder" /* ALL_ROUNDER */, true, 79, 78),
    createPlayer("Nitish Rana", "Batsman" /* BATSMAN */, true, 77, 72),
    createPlayer("Rinku Singh", "Batsman" /* BATSMAN */, false, 76, 80),
    createPlayer("Shardul Thakur", "All-rounder" /* ALL_ROUNDER */, true, 80, 78),
    createPlayer("Umesh Yadav", "Bowler" /* BOWLER */, true, 78, 75),
    createPlayer("Lockie Ferguson", "Bowler" /* BOWLER */, true, 82, 78),
    createPlayer("Rahmanullah Gurbaz", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 75, 70),
    createPlayer("Anukul Roy", "All-rounder" /* ALL_ROUNDER */, false, 70, 62),
    createPlayer("Harshit Rana", "Bowler" /* BOWLER */, false, 72, 65),
    createPlayer("Vaibhav Arora", "Bowler" /* BOWLER */, false, 71, 60),
    createPlayer("Suyash Sharma", "Bowler" /* BOWLER */, false, 69, 58),
    createPlayer("Mandeep Singh", "Batsman" /* BATSMAN */, true, 73, 68),
    createPlayer("Litton Das", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 74, 70)
  ],
  // Delhi Capitals
  dc: [
    createPlayer("Rishabh Pant", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 86, 88),
    createPlayer("David Warner", "Batsman" /* BATSMAN */, true, 85, 90),
    createPlayer("Axar Patel", "All-rounder" /* ALL_ROUNDER */, true, 82, 80),
    createPlayer("Prithvi Shaw", "Batsman" /* BATSMAN */, true, 79, 82),
    createPlayer("Mitchell Marsh", "All-rounder" /* ALL_ROUNDER */, true, 84, 85),
    createPlayer("Anrich Nortje", "Bowler" /* BOWLER */, true, 87, 85),
    createPlayer("Kuldeep Yadav", "Bowler" /* BOWLER */, true, 83, 80),
    createPlayer("Ishant Sharma", "Bowler" /* BOWLER */, true, 78, 75),
    createPlayer("Khaleel Ahmed", "Bowler" /* BOWLER */, true, 76, 72),
    createPlayer("Lalit Yadav", "All-rounder" /* ALL_ROUNDER */, false, 72, 65),
    createPlayer("Rovman Powell", "Batsman" /* BATSMAN */, true, 80, 75),
    createPlayer("Chetan Sakariya", "Bowler" /* BOWLER */, false, 74, 68),
    createPlayer("Yash Dhull", "Batsman" /* BATSMAN */, false, 70, 62),
    createPlayer("Ripal Patel", "Batsman" /* BATSMAN */, false, 71, 60),
    createPlayer("Pravin Dubey", "Bowler" /* BOWLER */, false, 69, 58),
    createPlayer("Vicky Ostwal", "Bowler" /* BOWLER */, false, 68, 55),
    createPlayer("Abishek Porel", "Wicket-keeper" /* WICKET_KEEPER */, false, 67, 52)
  ],
  // Sunrisers Hyderabad
  srh: [
    createPlayer("Aiden Markram", "Batsman" /* BATSMAN */, true, 84, 82),
    createPlayer("Heinrich Klaasen", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 83, 80),
    createPlayer("Bhuvneshwar Kumar", "Bowler" /* BOWLER */, true, 81, 85),
    createPlayer("T Natarajan", "Bowler" /* BOWLER */, true, 78, 75),
    createPlayer("Abdul Samad", "Batsman" /* BATSMAN */, false, 74, 70),
    createPlayer("Marco Jansen", "All-rounder" /* ALL_ROUNDER */, true, 79, 72),
    createPlayer("Abhishek Sharma", "All-rounder" /* ALL_ROUNDER */, false, 76, 78),
    createPlayer("Rahul Tripathi", "Batsman" /* BATSMAN */, true, 80, 78),
    createPlayer("Washington Sundar", "All-rounder" /* ALL_ROUNDER */, true, 77, 75),
    createPlayer("Mayank Markande", "Bowler" /* BOWLER */, false, 73, 68),
    createPlayer("Umran Malik", "Bowler" /* BOWLER */, true, 82, 85),
    createPlayer("Glenn Phillips", "Batsman" /* BATSMAN */, true, 78, 72),
    createPlayer("Fazalhaq Farooqi", "Bowler" /* BOWLER */, true, 75, 68),
    createPlayer("Vivrant Sharma", "Batsman" /* BATSMAN */, false, 70, 62),
    createPlayer("Sanvir Singh", "All-rounder" /* ALL_ROUNDER */, false, 69, 58),
    createPlayer("Mayank Dagar", "Bowler" /* BOWLER */, false, 71, 60),
    createPlayer("Nitish Kumar Reddy", "All-rounder" /* ALL_ROUNDER */, false, 68, 55)
  ],
  // Rajasthan Royals
  rr: [
    createPlayer("Sanju Samson", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 85, 88),
    createPlayer("Jos Buttler", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 91, 95),
    createPlayer("Yashasvi Jaiswal", "Batsman" /* BATSMAN */, true, 84, 85),
    createPlayer("Ravichandran Ashwin", "All-rounder" /* ALL_ROUNDER */, true, 82, 88),
    createPlayer("Yuzvendra Chahal", "Bowler" /* BOWLER */, true, 86, 90),
    createPlayer("Trent Boult", "Bowler" /* BOWLER */, true, 88, 88),
    createPlayer("Shimron Hetmyer", "Batsman" /* BATSMAN */, true, 81, 78),
    createPlayer("Devdutt Padikkal", "Batsman" /* BATSMAN */, true, 78, 80),
    createPlayer("Prasidh Krishna", "Bowler" /* BOWLER */, true, 80, 75),
    createPlayer("Riyan Parag", "All-rounder" /* ALL_ROUNDER */, false, 75, 72),
    createPlayer("Navdeep Saini", "Bowler" /* BOWLER */, true, 76, 72),
    createPlayer("KC Cariappa", "Bowler" /* BOWLER */, false, 70, 62),
    createPlayer("Kuldeep Sen", "Bowler" /* BOWLER */, false, 73, 68),
    createPlayer("Dhruv Jurel", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, false, 72, 70),
    createPlayer("Kunal Singh Rathore", "Batsman" /* BATSMAN */, false, 68, 55),
    createPlayer("Donovan Ferreira", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 74, 68),
    createPlayer("Adam Zampa", "Bowler" /* BOWLER */, true, 79, 75)
  ],
  // Punjab Kings
  pbks: [
    createPlayer("Shikhar Dhawan", "Batsman" /* BATSMAN */, true, 84, 90),
    createPlayer("Kagiso Rabada", "Bowler" /* BOWLER */, true, 87, 88),
    createPlayer("Arshdeep Singh", "Bowler" /* BOWLER */, true, 82, 85),
    createPlayer("Liam Livingstone", "All-rounder" /* ALL_ROUNDER */, true, 83, 82),
    createPlayer("Sam Curran", "All-rounder" /* ALL_ROUNDER */, true, 85, 85),
    createPlayer("Harpreet Brar", "Bowler" /* BOWLER */, false, 74, 70),
    createPlayer("Rahul Chahar", "Bowler" /* BOWLER */, true, 78, 75),
    createPlayer("Jitesh Sharma", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, false, 76, 78),
    createPlayer("Prabhsimran Singh", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, false, 73, 72),
    createPlayer("Nathan Ellis", "Bowler" /* BOWLER */, true, 79, 72),
    createPlayer("Rishi Dhawan", "All-rounder" /* ALL_ROUNDER */, true, 72, 68),
    createPlayer("Shahrukh Khan", "Batsman" /* BATSMAN */, false, 75, 80),
    createPlayer("Sikandar Raza", "All-rounder" /* ALL_ROUNDER */, true, 77, 75),
    createPlayer("Harpreet Bhatia", "Batsman" /* BATSMAN */, false, 71, 65),
    createPlayer("Vidwath Kaverappa", "Bowler" /* BOWLER */, false, 70, 62),
    createPlayer("Mohit Rathee", "Bowler" /* BOWLER */, false, 69, 58),
    createPlayer("Atharva Taide", "Batsman" /* BATSMAN */, false, 68, 55)
  ],
  // Gujarat Titans
  gt: [
    createPlayer("Hardik Pandya", "All-rounder" /* ALL_ROUNDER */, true, 87, 90),
    createPlayer("Shubman Gill", "Batsman" /* BATSMAN */, true, 88, 92),
    createPlayer("Rashid Khan", "Bowler" /* BOWLER */, true, 90, 95),
    createPlayer("Mohammed Shami", "Bowler" /* BOWLER */, true, 86, 88),
    createPlayer("David Miller", "Batsman" /* BATSMAN */, true, 83, 85),
    createPlayer("Wriddhiman Saha", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 78, 80),
    createPlayer("Rahul Tewatia", "All-rounder" /* ALL_ROUNDER */, false, 77, 82),
    createPlayer("Alzarri Joseph", "Bowler" /* BOWLER */, true, 81, 78),
    createPlayer("Yash Dayal", "Bowler" /* BOWLER */, false, 75, 70),
    createPlayer("Sai Sudharsan", "Batsman" /* BATSMAN */, false, 76, 75),
    createPlayer("Vijay Shankar", "All-rounder" /* ALL_ROUNDER */, true, 74, 72),
    createPlayer("Jayant Yadav", "Bowler" /* BOWLER */, true, 72, 68),
    createPlayer("Darshan Nalkande", "Bowler" /* BOWLER */, false, 71, 65),
    createPlayer("R Sai Kishore", "Bowler" /* BOWLER */, false, 73, 70),
    createPlayer("Abhinav Manohar", "Batsman" /* BATSMAN */, false, 72, 68),
    createPlayer("Pradeep Sangwan", "Bowler" /* BOWLER */, true, 70, 65),
    createPlayer("Matthew Wade", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 79, 78)
  ],
  // Lucknow Super Giants
  lsg: [
    createPlayer("KL Rahul", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 87, 92),
    createPlayer("Quinton de Kock", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 85, 88),
    createPlayer("Marcus Stoinis", "All-rounder" /* ALL_ROUNDER */, true, 84, 85),
    createPlayer("Ravi Bishnoi", "Bowler" /* BOWLER */, true, 82, 85),
    createPlayer("Nicholas Pooran", "Wicket-keeper Batsman" /* WICKET_KEEPER_BATSMAN */, true, 83, 82),
    createPlayer("Avesh Khan", "Bowler" /* BOWLER */, true, 79, 78),
    createPlayer("Krunal Pandya", "All-rounder" /* ALL_ROUNDER */, true, 78, 80),
    createPlayer("Mark Wood", "Bowler" /* BOWLER */, true, 86, 85),
    createPlayer("Ayush Badoni", "Batsman" /* BATSMAN */, false, 74, 75),
    createPlayer("Kyle Mayers", "All-rounder" /* ALL_ROUNDER */, true, 80, 78),
    createPlayer("Deepak Hooda", "All-rounder" /* ALL_ROUNDER */, true, 77, 75),
    createPlayer("Mohsin Khan", "Bowler" /* BOWLER */, false, 76, 78),
    createPlayer("Naveen-ul-Haq", "Bowler" /* BOWLER */, true, 75, 72),
    createPlayer("Yudhvir Singh", "All-rounder" /* ALL_ROUNDER */, false, 71, 65),
    createPlayer("Karan Sharma", "Bowler" /* BOWLER */, false, 70, 62),
    createPlayer("Amit Mishra", "Bowler" /* BOWLER */, true, 73, 70),
    createPlayer("Prerak Mankad", "All-rounder" /* ALL_ROUNDER */, false, 72, 68)
  ]
};
function getPreviousSeasonSquad(teamId) {
  return previousSeasonSquads[teamId] || [];
}

// setup.ts
init_squad_validator();
var SetupManager = class {
  constructor(teams3, onComplete) {
    this.teams = teams3;
    this.onComplete = onComplete;
    this.state = {
      auctionType: "mega" /* MEGA */,
      selectedTeam: null,
      previousSquad: [],
      retainedPlayers: [],
      retentionCost: 0,
      remainingPurse: 100
      // Default purse
    };
  }
  /**
   * Get current setup state
   */
  getState() {
    return { ...this.state };
  }
  /**
   * Set auction type
   */
  setAuctionType(type) {
    this.state.auctionType = type;
    this.updateRetentionCost();
  }
  /**
   * Set selected team
   */
  setSelectedTeam(teamId) {
    const team = this.teams.find((t) => t.id === teamId);
    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }
    this.state.selectedTeam = team;
    this.state.previousSquad = getPreviousSeasonSquad(teamId);
    this.state.retainedPlayers = [];
    this.state.remainingPurse = team.purse;
    this.updateRetentionCost();
  }
  /**
   * Toggle player retention
   */
  toggleRetention(playerId) {
    const player = this.state.previousSquad.find((p) => p.id === playerId);
    if (!player) {
      return { success: false, error: "Player not found in squad" };
    }
    const isRetained = this.state.retainedPlayers.some((p) => p.id === playerId);
    if (isRetained) {
      this.state.retainedPlayers = this.state.retainedPlayers.filter(
        (p) => p.id !== playerId
      );
    } else {
      this.state.retainedPlayers.push(player);
    }
    this.updateRetentionCost();
    return { success: true };
  }
  /**
   * Update retention cost and remaining purse
   */
  updateRetentionCost() {
    try {
      const retentionAuctionType = this.state.auctionType === "mega" /* MEGA */ ? "mega" /* MEGA */ : "mini" /* MINI */;
      this.state.retentionCost = validateRetentions(
        this.state.retainedPlayers,
        retentionAuctionType
      );
      const basePurse = this.state.selectedTeam?.purse || 100;
      this.state.remainingPurse = basePurse - this.state.retentionCost;
    } catch (error) {
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
  getRetentionError() {
    try {
      const retentionAuctionType = this.state.auctionType === "mega" /* MEGA */ ? "mega" /* MEGA */ : "mini" /* MINI */;
      validateRetentions(this.state.retainedPlayers, retentionAuctionType);
      return null;
    } catch (error) {
      if (error instanceof RetentionValidationError) {
        return error.message;
      }
      return "Unknown validation error";
    }
  }
  /**
   * Check if setup is complete and valid
   */
  isSetupComplete() {
    if (!this.state.selectedTeam)
      return false;
    if (this.getRetentionError())
      return false;
    return true;
  }
  /**
   * Complete setup and proceed to auction
   */
  completeSetup() {
    if (!this.isSetupComplete()) {
      throw new Error("Setup is not complete or invalid");
    }
    if (this.state.selectedTeam) {
      this.state.selectedTeam.retainedPlayers = [...this.state.retainedPlayers];
      this.state.selectedTeam.squad = [...this.state.retainedPlayers];
      this.state.selectedTeam.purse = this.state.remainingPurse;
      this.state.selectedTeam.overseasCount = this.state.retainedPlayers.filter(
        (player) => defaultOverseasCheck(player)
      ).length;
    }
    this.onComplete(this.state);
  }
  /**
   * Get retention cost breakdown
   */
  getRetentionBreakdown() {
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
      total: cappedCost + uncappedCost
    };
  }
};

// setup-ui.ts
init_teams();

// auction-state.ts
var globalState = {
  auctionType: null,
  selectedTeam: null,
  selectedTeamId: null
};
function setAuctionType(type) {
  globalState.auctionType = type;
}
function setSelectedTeam(team) {
  globalState.selectedTeam = { ...team };
  globalState.selectedTeamId = team.id;
}
function getSelectedTeamId() {
  return globalState.selectedTeamId;
}

// setup-ui.ts
var setupScreenEl;
var auctionScreenEl;
var auctionTypeRadios;
var teamSelectorEl;
var squadSectionEl;
var previousSquadEl;
var retentionSummaryEl;
var retainedCountEl;
var retentionCostEl;
var remainingPurseEl;
var retentionErrorsEl;
var proceedBtn;
function getUIElements() {
  setupScreenEl = document.getElementById("setup-screen");
  auctionScreenEl = document.getElementById("auction-screen");
  auctionTypeRadios = document.querySelectorAll('input[name="auction-type"]');
  teamSelectorEl = document.getElementById("setup-team-selector");
  squadSectionEl = document.getElementById("squad-section");
  previousSquadEl = document.getElementById("previous-squad");
  retentionSummaryEl = document.getElementById("retention-summary");
  retainedCountEl = document.getElementById("retained-count");
  retentionCostEl = document.getElementById("retention-cost");
  remainingPurseEl = document.getElementById("remaining-purse");
  retentionErrorsEl = document.getElementById("retention-errors");
  proceedBtn = document.getElementById("proceed-btn");
}
var setupManager = null;
var onSetupComplete = null;
async function initializeSetupScreen(onComplete) {
  if (document.readyState === "loading") {
    await new Promise((resolve) => {
      document.addEventListener("DOMContentLoaded", resolve);
    });
  }
  getUIElements();
  if (!teamSelectorEl) {
    console.error("Team selector element not found. Retrying...");
    await new Promise((resolve) => setTimeout(resolve, 100));
    getUIElements();
  }
  const teams3 = await getInitialTeams();
  console.log("Loaded teams:", teams3.length);
  onSetupComplete = onComplete;
  setupManager = new SetupManager(teams3, onComplete);
  populateTeamSelector(teams3);
  setupEventListeners();
  if (proceedBtn) {
    proceedBtn.disabled = true;
  }
  if (setupScreenEl) {
    setupScreenEl.style.display = "block";
  }
  if (auctionScreenEl) {
    auctionScreenEl.style.display = "none";
  }
}
function populateTeamSelector(teams3) {
  if (!teamSelectorEl) {
    console.error("Team selector element not found");
    return;
  }
  if (!teams3 || teams3.length === 0) {
    console.error("No teams provided to populate selector");
    return;
  }
  teamSelectorEl.innerHTML = '<option value="">-- Select Team --</option>';
  teams3.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.name;
    teamSelectorEl.appendChild(option);
  });
  console.log(`Populated team selector with ${teams3.length} teams`);
}
function setupEventListeners() {
  auctionTypeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const type = e.target.value;
      if (setupManager) {
        setupManager.setAuctionType(type);
        renderPreviousSquad();
        updateRetentionSummary();
        updateProceedButton();
      }
    });
  });
  teamSelectorEl.addEventListener("change", (e) => {
    const teamId = e.target.value;
    if (teamId && setupManager) {
      try {
        setupManager.setSelectedTeam(teamId);
        renderPreviousSquad();
        updateRetentionSummary();
        squadSectionEl.style.display = "block";
        retentionSummaryEl.style.display = "block";
        updateProceedButton();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    } else {
      squadSectionEl.style.display = "none";
      retentionSummaryEl.style.display = "none";
      proceedBtn.disabled = true;
    }
  });
  proceedBtn.addEventListener("click", () => {
    if (setupManager && setupManager.isSetupComplete()) {
      try {
        setupManager.completeSetup();
        const state = setupManager.getState();
        if (state.auctionType) {
          setAuctionType(state.auctionType);
        }
        if (state.selectedTeam) {
          setSelectedTeam(state.selectedTeam);
        }
        if (onSetupComplete) {
          onSetupComplete(state);
          setupScreenEl.style.display = "none";
          auctionScreenEl.style.display = "block";
        }
      } catch (error) {
        alert(`Cannot proceed: ${error.message}`);
      }
    }
  });
}
function renderPreviousSquad() {
  if (!setupManager)
    return;
  const state = setupManager.getState();
  const squad = state.previousSquad;
  const retainedIds = new Set(state.retainedPlayers.map((p) => p.id));
  if (squad.length === 0) {
    previousSquadEl.innerHTML = '<p class="no-squad">No previous season squad available</p>';
    return;
  }
  previousSquadEl.innerHTML = squad.map((player) => {
    const isRetained = retainedIds.has(player.id);
    const playerCost = getPlayerRetentionCost(player, state.retainedPlayers);
    return `
        <div class="squad-player ${isRetained ? "retained" : ""}">
          <label class="player-checkbox">
            <input 
              type="checkbox" 
              data-player-id="${player.id}"
              ${isRetained ? "checked" : ""}
            >
            <div class="player-details">
              <div class="player-name">${player.name}</div>
              <div class="player-meta">
                <span>${player.role}</span>
                <span>${player.isCapped ? "Capped" : "Uncapped"}</span>
                <span class="retention-cost">${playerCost > 0 ? `${playerCost} Cr` : ""}</span>
              </div>
            </div>
          </label>
        </div>
      `;
  }).join("");
  previousSquadEl.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const playerId = e.target.getAttribute("data-player-id");
      if (playerId && setupManager) {
        const result = setupManager.toggleRetention(playerId);
        if (!result.success) {
          alert(result.error);
          e.target.checked = !e.target.checked;
        } else {
          renderPreviousSquad();
          updateRetentionSummary();
        }
      }
    });
  });
}
function getPlayerRetentionCost(player, allRetained) {
  if (!allRetained.some((p) => p.id === player.id)) {
    return 0;
  }
  const cappedPlayers = allRetained.filter((p) => p.isCapped).sort((a, b) => {
    return b.rating - a.rating;
  });
  const uncappedPlayers = allRetained.filter((p) => !p.isCapped);
  if (player.isCapped) {
    const index = cappedPlayers.findIndex((p) => p.id === player.id);
    const costs = [18, 14, 8, 4];
    return costs[index] || 0;
  } else {
    return 4;
  }
}
function updateRetentionSummary() {
  if (!setupManager)
    return;
  const state = setupManager.getState();
  const error = setupManager.getRetentionError();
  retainedCountEl.textContent = state.retainedPlayers.length.toString();
  retentionCostEl.textContent = `${state.retentionCost.toFixed(2)} Cr`;
  remainingPurseEl.textContent = `${state.remainingPurse.toFixed(2)} Cr`;
  const isMega = state.auctionType === "mega";
  const cappedCount = state.retainedPlayers.filter((p) => p.isCapped).length;
  const uncappedCount = state.retainedPlayers.filter((p) => !p.isCapped).length;
  let rulesText = "";
  if (isMega) {
    rulesText = `Mega Auction Rules: Max 6 total (${state.retainedPlayers.length}/6), Max 4 capped (${cappedCount}/4), Max 2 uncapped (${uncappedCount}/2)`;
  } else {
    rulesText = `Mini Auction: Unlimited retentions allowed (${state.retainedPlayers.length} retained)`;
  }
  if (error) {
    retentionErrorsEl.innerHTML = `<div class="error-text">${error}</div><div class="rules-text">${rulesText}</div>`;
    retentionErrorsEl.style.display = "block";
    retentionErrorsEl.className = "error-message";
  } else {
    retentionErrorsEl.innerHTML = `<div class="rules-text">${rulesText}</div>`;
    retentionErrorsEl.style.display = "block";
    retentionErrorsEl.className = "info-message";
  }
  if (state.remainingPurse < 10) {
    remainingPurseEl.className = "purse-amount purse-low";
  } else {
    remainingPurseEl.className = "purse-amount";
  }
  updateProceedButton();
}
function updateProceedButton() {
  if (!setupManager) {
    proceedBtn.disabled = true;
    return;
  }
  const state = setupManager.getState();
  const error = setupManager.getRetentionError();
  if (!state.selectedTeam) {
    proceedBtn.disabled = true;
    return;
  }
  if (error) {
    proceedBtn.disabled = true;
    return;
  }
  proceedBtn.disabled = !setupManager.isSetupComplete();
}

// ui.ts
init_ai_bidding();
var landingScreenEl = document.getElementById("landing-screen");
var setupScreenEl2 = document.getElementById("setup-screen");
var auctionScreenEl2 = document.getElementById("auction-screen");
var startAuctionBtn = document.getElementById("start-auction-btn");
var playerInfoEl = document.getElementById("player-info");
var currentBidEl = document.getElementById("current-bid");
var leadingTeamEl = document.getElementById("leading-team");
var timerEl = document.getElementById("timer");
var auctionStatusEl = document.getElementById("auction-status");
var startBtn = document.getElementById("start-btn");
var nextBtn = document.getElementById("next-btn");
var pauseBtn = document.getElementById("pause-btn");
var resumeBtn = document.getElementById("resume-btn");
var teamsListEl = document.getElementById("teams-list");
var teamSelectorEl2 = document.getElementById("team-selector");
var nextBidAmountEl = document.getElementById("next-bid-amount");
var manualBidBtn = document.getElementById("manual-bid-btn");
var engine = null;
var manager = null;
var teams2 = [];
async function initializeTeams() {
  const { getInitialTeams: getInitialTeams2 } = await Promise.resolve().then(() => (init_teams(), teams_exports));
  return getInitialTeams2();
}
async function initializeAuction() {
  try {
    teams2 = await initializeTeams();
    engine = new AuctionEngine(teams2, {
      timerDuration: 30
      // bidIncrement is now handled by IPL-style increments (getNextBid)
    });
    const { loadPlayers: loadPlayers2 } = await Promise.resolve().then(() => (init_auction_manager(), auction_manager_exports));
    const players2 = await loadPlayers2();
    manager = new AuctionManager(engine, players2, {
      autoProceed: false
    });
    manager.subscribe(handleAuctionEvent);
    renderTeams();
    console.log("Auction initialized");
  } catch (error) {
    console.error("Error initializing auction:", error);
    alert("Failed to initialize auction. Make sure players.ts exists.");
  }
}
function handleAuctionEvent(event) {
  const state = event.state;
  switch (event.type) {
    case "player_set" /* PLAYER_SET */:
      updatePlayerCard(state.currentPlayer);
      updateAuctionStatus(state);
      renderTeams();
      updateNextBidAmount();
      updateManualBidButton();
      break;
    case "bid_placed" /* BID_PLACED */:
      updateAuctionStatus(state);
      renderTeams();
      updateTeamSelector();
      updateNextBidAmount();
      updateManualBidButton();
      break;
    case "timer_tick" /* TIMER_TICK */:
      updateTimer(state.timer);
      break;
    case "timer_expired" /* TIMER_EXPIRED */:
      updateTimer(0);
      break;
    case "player_sold" /* PLAYER_SOLD */:
      updateAuctionStatus(state);
      renderTeams();
      updateTeamSelector();
      updateNextBidAmount();
      updateManualBidButton();
      alert(`Player ${state.currentPlayer?.name} sold to ${state.leadingTeam?.name} for ${state.currentBid.toFixed(2)} Cr`);
      break;
    case "player_unsold" /* PLAYER_UNSOLD */:
      updateAuctionStatus(state);
      alert(`Player ${state.currentPlayer?.name} went unsold`);
      break;
    case "auction_ended" /* AUCTION_ENDED */:
      updateAuctionStatus(state);
      if (event.data?.result === "COMPLETE") {
        alert("Auction completed!");
        startBtn.disabled = false;
        nextBtn.disabled = true;
      }
      break;
    case "state_changed" /* STATE_CHANGED */:
      updateAuctionStatus(state);
      renderTeams();
      updateNextBidAmount();
      updateManualBidButton();
      break;
  }
}
function isLikelyOverseas(playerName) {
  const commonOverseasPatterns = [
    /\b(steve|david|kane|williamson|trent|boult|rashid|khan|andre|russell|sunil|narine|kieron|pollard|dwayne|bravo|chris|gayle|ab|de|villiers|faf|du|plessis|glenn|maxwell|marcus|stoinis|pat|cummins|mitchell|starc|josh|hazlewood|ben|stokes|jos|buttler|eoin|morgan|jason|roy|jofra|archer|sam|curran|tom|curran|moeen|ali|adil|rashid|dawid|malan|jonny|bairstow|chris|woakes|mark|wood|liam|livingstone|phil|salt|harry|brook|will|jacks|reece|topley|david|willey|tymal|mills|jordan|cox|matt|parkinson|tom|helm|richard|gleeson|dan|lawrence|ollie|pope|ben|foakes|zak|crawley|dom|sibley|rory|burns|haseeb|hameed|daniel|lawrence|ollie|robinson|craig|overton|dom|bess|jack|leach|matt|parkinson|mason|crane|tom|helm|richard|gleeson|jordan|cox|tomalin|mills|david|willey|reece|topley|will|jacks|harry|brook|liam|livingstone|phil|salt|chris|woakes|mark|wood|moeen|ali|adil|rashid|dawid|malan|jonny|bairstow|sam|curran|tom|curran|jofra|archer|jason|roy|eoin|morgan|jos|buttler|ben|stokes|mitchell|starc|josh|hazlewood|pat|cummins|marcus|stoinis|glenn|maxwell|faf|du|plessis|ab|de|villiers|chris|gayle|dwayne|bravo|kieron|pollard|sunil|narine|andre|russell|rashid|khan|trent|boult|kane|williamson|david|warner|steve|smith|aaron|finch|mitch|marsh|marcus|stoinis|glenn|maxwell|daniel|sams|tim|david|josh|inglis|matthew|wade|alex|carey|pat|cummins|mitchell|starc|josh|hazlewood|kane|richardson|jason|behrendorff|daniel|worrall|nathan|ellis|sean|abbott|michael|neser|scott|boland|lance|morris|spencer|johnson|tanveer|sangha|todd|murphy|matthew|kuhnemann|mitchell|swepson|ashton|agar|adam|zampa|nathan|lyon|steven|smith|marnus|labuschagne|travis|head|cameron|green|marcus|harris|usman|khawaja|david|warner|matt|renshaw|joe|burns|will|pucovski|henry|hunt|tim|ward|jake|lehmann|daniel|hughes|kurtis|patterson|peter|handscomb|matt|wade|alex|carey|josh|inglis|jimmy|peirson|peter|nevill|sam|whiteman|ben|mcdermott|josh|philippe|harry|nielsen|baxter|holt|jake|fraser-mcgurk|oliver|davies|teague|wyllie|cooper|connolly|will|sutherland|aaron|hardie|matt|short|beau|webster|jordan|buckingham|will|prestwidge|jack|wildermuth|james|bazley|michael|neser|sean|abbott|daniel|sams|nathan|mcdermott|matt|kelly|joel|paris|andrew|tye|jason|behrendorff|daniel|worrall|kane|richardson|riley|meredith|scott|boland|lance|morris|spencer|johnson|tanveer|sangha|todd|murphy|matthew|kuhnemann|mitchell|swepson|ashton|agar|adam|zampa|nathan|lyon)\b/i
  ];
  return commonOverseasPatterns.some((pattern) => pattern.test(playerName));
}
function getFormIndicator(rating) {
  if (rating >= 85)
    return "Excellent";
  if (rating >= 70)
    return "Good";
  if (rating >= 55)
    return "Average";
  if (rating >= 40)
    return "Below Average";
  return "Poor";
}
function updatePlayerCard(player) {
  if (!player) {
    playerInfoEl.innerHTML = '<p class="no-player">No player set</p>';
    return;
  }
  const isOverseas = isLikelyOverseas(player.name);
  const formIndicator = getFormIndicator(player.rating);
  playerInfoEl.innerHTML = `
    <div class="player-info-item">
      <label>Name</label>
      <span>${player.name}</span>
    </div>
    <div class="player-info-item">
      <label>Role</label>
      <span>${player.role}</span>
    </div>
    <div class="player-info-item">
      <label>Base Price</label>
      <span>${player.basePrice.toFixed(2)} Cr</span>
    </div>
    <div class="player-info-item">
      <label>Status</label>
      <span>${player.isCapped ? "Capped" : "Uncapped"}${isOverseas ? " \u2022 Overseas" : ""}</span>
    </div>
    <div class="player-info-item">
      <label>Form</label>
      <span>${formIndicator} (${player.rating})</span>
    </div>
  `;
}
function updateAuctionStatus(state) {
  currentBidEl.textContent = `${state.currentBid.toFixed(2)} Cr`;
  leadingTeamEl.textContent = state.leadingTeam?.name || "-";
  updateTimer(state.timer);
  updateStatusBadge(state.status);
}
function updateTimer(seconds) {
  timerEl.textContent = `${seconds}s`;
  if (seconds <= 5) {
    timerEl.style.color = "#dc2626";
  } else if (seconds <= 10) {
    timerEl.style.color = "#f59e0b";
  } else {
    timerEl.style.color = "#059669";
  }
}
function updateStatusBadge(status) {
  auctionStatusEl.textContent = status.toUpperCase();
  auctionStatusEl.className = "status-badge " + status.toLowerCase();
}
function renderTeams() {
  if (!engine)
    return;
  const state = engine.getState();
  const leadingTeamId = state.leadingTeam?.id;
  const selectedTeamId = getSelectedTeamId();
  const canBid = state.status === "bidding" /* BIDDING */;
  const currentBid = state.currentBid || 0;
  teamsListEl.innerHTML = teams2.map((team) => {
    const isLeading = team.id === leadingTeamId;
    const isSelected = team.id === selectedTeamId;
    const purseClass = team.purse < 10 ? "purse-low" : "purse-amount";
    const nextBid = canBid ? getNextBidAmount(currentBid) : 0;
    const canAfford = canBid && team.purse >= nextBid;
    const cardClasses = ["team-card"];
    if (isLeading)
      cardClasses.push("leading");
    if (isSelected)
      cardClasses.push("user-selected");
    return `
        <div class="${cardClasses.join(" ")}">
          <div class="team-name-header">
            ${team.name}
            ${isSelected ? '<span class="user-team-badge">Your Team</span>' : ""}
          </div>
          <div class="team-stats">
            <div class="team-stat">
              <label>Purse:</label>
              <span class="${purseClass}">${team.purse.toFixed(2)} Cr</span>
            </div>
            <div class="team-stat">
              <label>Squad Size:</label>
              <span>${team.squad.length}</span>
            </div>
            <div class="team-stat">
              <label>Retained:</label>
              <span>${team.retainedPlayers.length}</span>
            </div>
            <div class="team-stat">
              <label>Aggression:</label>
              <span>${team.aggression}</span>
            </div>
          </div>
          ${canBid && isSelected ? `
            <div class="team-bid-section">
              <button 
                class="btn btn-bid" 
                data-team-id="${team.id}"
                ${!canAfford ? "disabled" : ""}
                title="${canAfford ? `Bid ${nextBid.toFixed(2)} Cr` : `Insufficient purse. Need ${nextBid.toFixed(2)} Cr`}"
              >
                Bid ${nextBid.toFixed(2)} Cr
              </button>
            </div>
          ` : ""}
          ${canBid && !isSelected ? `
            <div class="team-bid-section">
              <div class="ai-bidding-indicator">AI Controlled</div>
            </div>
          ` : ""}
        </div>
      `;
  }).join("");
  if (canBid) {
    teamsListEl.querySelectorAll(".btn-bid").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const teamId = e.target.getAttribute("data-team-id");
        const selectedTeamId2 = getSelectedTeamId();
        if (teamId && engine && teamId === selectedTeamId2) {
          handleManualBid(teamId);
        } else if (teamId !== selectedTeamId2) {
          alert("You can only bid manually for your selected team. Other teams are AI-controlled.");
        }
      });
    });
  }
}
function getNextBidAmount(currentBid) {
  return getNextBid(currentBid);
}
function initializeManualBidding() {
  const selectedTeamId = getSelectedTeamId();
  updateTeamSelector();
  if (selectedTeamId) {
    teamSelectorEl2.value = selectedTeamId;
    teamSelectorEl2.disabled = true;
  }
  updateNextBidAmount();
  updateManualBidButton();
  teamSelectorEl2.addEventListener("change", () => {
    const currentValue = teamSelectorEl2.value;
    if (currentValue !== selectedTeamId) {
      teamSelectorEl2.value = selectedTeamId || "";
      alert("You can only bid for your selected team.");
    }
    updateManualBidButton();
    updateNextBidAmount();
  });
  manualBidBtn.addEventListener("click", () => {
    if (selectedTeamId && engine) {
      handleManualBid(selectedTeamId);
    } else {
      alert("No team selected. Please select a team in the setup screen.");
    }
  });
}
function updateTeamSelector() {
  teamSelectorEl2.innerHTML = '<option value="">-- Select Team --</option>';
  teams2.forEach((team) => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = `${team.name} (${team.purse.toFixed(2)} Cr)`;
    teamSelectorEl2.appendChild(option);
  });
}
function updateNextBidAmount() {
  if (!engine) {
    nextBidAmountEl.textContent = "-";
    return;
  }
  const state = engine.getState();
  if (state.status === "bidding" /* BIDDING */ && state.currentBid > 0) {
    const nextBid = getNextBidAmount(state.currentBid);
    nextBidAmountEl.textContent = `${nextBid.toFixed(2)} Cr`;
  } else {
    nextBidAmountEl.textContent = "-";
  }
}
function updateManualBidButton() {
  if (!engine) {
    manualBidBtn.disabled = true;
    return;
  }
  const state = engine.getState();
  const selectedTeamId = getSelectedTeamId();
  if (!selectedTeamId) {
    manualBidBtn.disabled = true;
    manualBidBtn.textContent = "No Team Selected";
    return;
  }
  if (state.status !== "bidding" /* BIDDING */) {
    manualBidBtn.disabled = true;
    manualBidBtn.textContent = "Auction Not Active";
    return;
  }
  if (!state.currentPlayer) {
    manualBidBtn.disabled = true;
    manualBidBtn.textContent = "No Player Set";
    return;
  }
  const selectedTeam = teams2.find((t) => t.id === selectedTeamId);
  if (!selectedTeam) {
    manualBidBtn.disabled = true;
    manualBidBtn.textContent = "Team Not Found";
    return;
  }
  const nextBid = getNextBidAmount(state.currentBid);
  const canAfford = selectedTeam.purse >= nextBid;
  manualBidBtn.disabled = !canAfford;
  if (canAfford) {
    manualBidBtn.textContent = `Place Bid (${nextBid.toFixed(2)} Cr)`;
  } else {
    manualBidBtn.textContent = `Insufficient Purse (Need ${nextBid.toFixed(2)} Cr)`;
  }
}
function handleManualBid(teamId) {
  if (!engine)
    return;
  const selectedTeamId = getSelectedTeamId();
  if (teamId !== selectedTeamId) {
    alert("You can only bid manually for your selected team. Other teams are AI-controlled.");
    return;
  }
  try {
    engine.placeManualBid(teamId);
    setTimeout(() => {
      updateManualBidButton();
      updateNextBidAmount();
    }, 100);
  } catch (error) {
    alert(`Cannot place bid: ${error.message}`);
    console.error("Manual bid error:", error);
    updateManualBidButton();
  }
}
startBtn.addEventListener("click", async () => {
  if (!manager) {
    await initializeAuction();
  }
  if (manager) {
    manager.start();
    startBtn.disabled = true;
    nextBtn.disabled = false;
    pauseBtn.disabled = false;
  }
});
nextBtn.addEventListener("click", () => {
  if (manager) {
    manager.proceedToNextPlayer();
  }
});
pauseBtn.addEventListener("click", () => {
  if (manager) {
    manager.pause();
    pauseBtn.disabled = true;
    resumeBtn.disabled = false;
  }
});
resumeBtn.addEventListener("click", () => {
  if (manager) {
    manager.resume();
    pauseBtn.disabled = false;
    resumeBtn.disabled = true;
  }
});
function showLandingPage() {
  landingScreenEl.style.display = "block";
  setupScreenEl2.style.display = "none";
  auctionScreenEl2.style.display = "none";
}
function showSetupPage() {
  landingScreenEl.style.display = "none";
  setupScreenEl2.style.display = "block";
  auctionScreenEl2.style.display = "none";
}
function showAuctionPage() {
  landingScreenEl.style.display = "none";
  setupScreenEl2.style.display = "none";
  auctionScreenEl2.style.display = "block";
}
async function initializeApp() {
  showLandingPage();
  startAuctionBtn.addEventListener("click", async () => {
    showSetupPage();
    teams2 = await initializeTeams();
    await initializeSetupScreen((setupState) => {
      initializeAuctionWithSetup(setupState);
    });
  });
}
async function initializeAuctionWithSetup(setupState) {
  try {
    const { getInitialTeams: getInitialTeams2 } = await Promise.resolve().then(() => (init_teams(), teams_exports));
    const allTeams = await getInitialTeams2();
    if (setupState.selectedTeam) {
      const selectedTeamIndex = allTeams.findIndex((t) => t.id === setupState.selectedTeam.id);
      if (selectedTeamIndex !== -1) {
        allTeams[selectedTeamIndex] = {
          ...setupState.selectedTeam,
          // Ensure all properties are copied
          squad: [...setupState.selectedTeam.squad],
          // Contains retained players
          retainedPlayers: [...setupState.selectedTeam.retainedPlayers],
          roleNeeds: { ...setupState.selectedTeam.roleNeeds },
          overseasCount: setupState.selectedTeam.overseasCount || 0
        };
        const retainedIds = new Set(setupState.selectedTeam.retainedPlayers.map((p) => p.id));
        const squadIds = new Set(setupState.selectedTeam.squad.map((p) => p.id));
        retainedIds.forEach((id) => {
          if (!squadIds.has(id)) {
            console.warn(`Retained player ${id} not found in squad. Adding...`);
            const retainedPlayer = setupState.selectedTeam.retainedPlayers.find((p) => p.id === id);
            if (retainedPlayer) {
              allTeams[selectedTeamIndex].squad.push(retainedPlayer);
            }
          }
        });
      }
    }
    teams2 = allTeams;
    engine = new AuctionEngine(teams2, {
      timerDuration: 30
      // bidIncrement is now handled by IPL-style increments (getNextBid)
    });
    const selectedTeamId = getSelectedTeamId();
    if (selectedTeamId) {
      engine.setUserSelectedTeam(selectedTeamId);
    }
    const { loadPlayers: loadPlayers2 } = await Promise.resolve().then(() => (init_auction_manager(), auction_manager_exports));
    const players2 = await loadPlayers2();
    manager = new AuctionManager(engine, players2, {
      autoProceed: false
    });
    manager.subscribe(handleAuctionEvent);
    renderTeams();
    initializeManualBidding();
    showAuctionPage();
    console.log("Auction initialized after setup");
  } catch (error) {
    console.error("Error initializing auction:", error);
    alert("Failed to initialize auction. Make sure players.ts exists.");
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initializeApp();
  });
} else {
  initializeApp();
}
