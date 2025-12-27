import { AuctionEngine, AuctionEvent, AuctionEventType } from './auction-engine';
import { Player, Team, AuctionStatus } from './types';
import { writeFileSync } from 'fs';

/**
 * Individual bid record
 */
export interface BidRecord {
  /** Timestamp of the bid */
  timestamp: number;
  /** Team that placed the bid */
  team: string;
  /** Bid amount */
  amount: number;
  /** Time elapsed since auction start (seconds) */
  elapsedTime: number;
}

/**
 * Complete auction log entry
 */
export interface AuctionLogEntry {
  /** Player name */
  playerName: string;
  /** Player ID */
  playerId: string;
  /** Player role */
  playerRole: string;
  /** Player rating */
  playerRating: number;
  /** Base price */
  basePrice: number;
  /** Min price */
  minPrice: number;
  /** Max price */
  maxPrice: number;
  /** Final sold price (0 if unsold) */
  finalPrice: number;
  /** Winning team name (null if unsold) */
  winningTeam: string | null;
  /** Winning team ID (null if unsold) */
  winningTeamId: string | null;
  /** Number of bids placed */
  numberOfBids: number;
  /** Auction duration in seconds */
  auctionDuration: number;
  /** Status: SOLD or UNSOLD */
  status: 'SOLD' | 'UNSOLD';
  /** Reason if unsold */
  unsoldReason?: string;
  /** All bid records in chronological order */
  bidHistory: BidRecord[];
  /** Timestamp when auction started */
  auctionStartTime: number;
  /** Timestamp when auction ended */
  auctionEndTime: number;
}

/**
 * Complete auction log
 */
export interface AuctionLog {
  /** All auction entries */
  entries: AuctionLogEntry[];
  /** Total players auctioned */
  totalPlayers: number;
  /** Total players sold */
  totalSold: number;
  /** Total players unsold */
  totalUnsold: number;
  /** Total revenue */
  totalRevenue: number;
  /** Auction start timestamp */
  auctionStartTimestamp: number;
  /** Auction end timestamp */
  auctionEndTimestamp: number;
  /** Total auction duration in seconds */
  totalDuration: number;
}

/**
 * Auction Logger
 *
 * Tracks and logs all auction events for debugging and analysis
 */
export class AuctionLogger {
  private logs: AuctionLogEntry[] = [];
  private currentEntry: Partial<AuctionLogEntry> | null = null;
  private auctionStartTime: number = 0;
  private bidCount: number = 0;
  private bidHistory: BidRecord[] = [];
  private playerStartTime: number = 0;

  /**
   * Attach logger to an auction engine
   */
  attach(engine: AuctionEngine): void {
    engine.subscribe((event) => this.handleEvent(event));
  }

  /**
   * Handle auction events
   */
  private handleEvent(event: AuctionEvent): void {
    switch (event.type) {
      case AuctionEventType.PLAYER_SET:
        this.handlePlayerSet(event);
        break;

      case AuctionEventType.BID_PLACED:
        this.handleBidPlaced(event);
        break;

      case AuctionEventType.PLAYER_SOLD:
        this.handlePlayerSold(event);
        break;

      case AuctionEventType.PLAYER_UNSOLD:
        this.handlePlayerUnsold(event);
        break;

      case AuctionEventType.AUCTION_ENDED:
        if (event.data?.result === 'COMPLETE') {
          this.handleAuctionComplete();
        }
        break;
    }
  }

  /**
   * Handle player set event
   */
  private handlePlayerSet(event: AuctionEvent): void {
    const player = event.state.currentPlayer;
    if (!player) return;

    // Save previous entry if exists
    if (this.currentEntry && this.currentEntry.playerName) {
      this.finalizeCurrentEntry('UNSOLD', 'Auction interrupted');
    }

    // Start new entry
    this.playerStartTime = Date.now();
    this.bidCount = 0;
    this.bidHistory = [];

    this.currentEntry = {
      playerName: player.name,
      playerId: player.id,
      playerRole: player.role,
      playerRating: player.rating,
      basePrice: player.basePrice,
      minPrice: player.minPrice,
      maxPrice: player.maxPrice,
      finalPrice: 0,
      winningTeam: null,
      winningTeamId: null,
      numberOfBids: 0,
      auctionDuration: 0,
      status: 'UNSOLD',
      bidHistory: [],
      auctionStartTime: this.playerStartTime,
      auctionEndTime: 0,
    };

    if (this.auctionStartTime === 0) {
      this.auctionStartTime = this.playerStartTime;
    }
  }

  /**
   * Handle bid placed event
   */
  private handleBidPlaced(event: AuctionEvent): void {
    if (!this.currentEntry) return;

    const bidData = event.data;
    const team = bidData?.team as Team | undefined;
    const bidAmount = bidData?.bidAmount as number | undefined;

    if (!team || bidAmount === undefined) return;

    this.bidCount++;
    const elapsedTime = (Date.now() - this.playerStartTime) / 1000;

    this.bidHistory.push({
      timestamp: Date.now(),
      team: team.name,
      amount: bidAmount,
      elapsedTime,
    });

    this.currentEntry.numberOfBids = this.bidCount;
    this.currentEntry.bidHistory = [...this.bidHistory];
  }

  /**
   * Handle player sold event
   */
  private handlePlayerSold(event: AuctionEvent): void {
    if (!this.currentEntry) return;

    const state = event.state;
    const bidData = event.data;
    const team = bidData?.team as Team | undefined;
    const bidAmount = bidData?.bidAmount as number | undefined;

    this.currentEntry.finalPrice = bidAmount || state.currentBid || 0;
    this.currentEntry.winningTeam = team?.name || state.leadingTeam?.name || null;
    this.currentEntry.winningTeamId = team?.id || state.leadingTeam?.id || null;
    this.currentEntry.status = 'SOLD';
    this.currentEntry.auctionEndTime = Date.now();
    this.currentEntry.auctionDuration = (this.currentEntry.auctionEndTime - this.playerStartTime) / 1000;

    this.finalizeCurrentEntry('SOLD');
  }

  /**
   * Handle player unsold event
   */
  private handlePlayerUnsold(event: AuctionEvent): void {
    if (!this.currentEntry) return;

    const unsoldData = event.data;
    const reason = unsoldData?.reason as string | undefined;

    this.currentEntry.status = 'UNSOLD';
    this.currentEntry.unsoldReason = reason || 'No bids received';
    this.currentEntry.auctionEndTime = Date.now();
    this.currentEntry.auctionDuration = (this.currentEntry.auctionEndTime - this.playerStartTime) / 1000;

    this.finalizeCurrentEntry('UNSOLD', reason);
  }

  /**
   * Finalize current entry and add to logs
   */
  private finalizeCurrentEntry(status: 'SOLD' | 'UNSOLD', reason?: string): void {
    if (!this.currentEntry || !this.currentEntry.playerName) return;

    const entry: AuctionLogEntry = {
      playerName: this.currentEntry.playerName,
      playerId: this.currentEntry.playerId!,
      playerRole: this.currentEntry.playerRole!,
      playerRating: this.currentEntry.playerRating!,
      basePrice: this.currentEntry.basePrice!,
      minPrice: this.currentEntry.minPrice!,
      maxPrice: this.currentEntry.maxPrice!,
      finalPrice: this.currentEntry.finalPrice || 0,
      winningTeam: this.currentEntry.winningTeam || null,
      winningTeamId: this.currentEntry.winningTeamId || null,
      numberOfBids: this.currentEntry.numberOfBids || 0,
      auctionDuration: this.currentEntry.auctionDuration || 0,
      status: this.currentEntry.status || status,
      unsoldReason: status === 'UNSOLD' ? (reason || this.currentEntry.unsoldReason) : undefined,
      bidHistory: this.currentEntry.bidHistory || [],
      auctionStartTime: this.currentEntry.auctionStartTime!,
      auctionEndTime: this.currentEntry.auctionEndTime || Date.now(),
    };

    this.logs.push(entry);
    this.currentEntry = null;
  }

  /**
   * Handle auction complete
   */
  private handleAuctionComplete(): void {
    // Finalize any pending entry
    if (this.currentEntry && this.currentEntry.playerName) {
      this.finalizeCurrentEntry('UNSOLD', 'Auction completed');
    }
  }

  /**
   * Get all logs
   */
  getLogs(): Readonly<AuctionLogEntry[]> {
    return [...this.logs];
  }

  /**
   * Get complete auction log with statistics
   */
  getCompleteLog(): AuctionLog {
    const totalSold = this.logs.filter((entry) => entry.status === 'SOLD').length;
    const totalUnsold = this.logs.filter((entry) => entry.status === 'UNSOLD').length;
    const totalRevenue = this.logs.reduce((sum, entry) => sum + entry.finalPrice, 0);
    const auctionEndTime = this.logs.length > 0
      ? Math.max(...this.logs.map((entry) => entry.auctionEndTime))
      : Date.now();
    const totalDuration = (auctionEndTime - this.auctionStartTime) / 1000;

    return {
      entries: [...this.logs],
      totalPlayers: this.logs.length,
      totalSold,
      totalUnsold,
      totalRevenue,
      auctionStartTimestamp: this.auctionStartTime,
      auctionEndTimestamp: auctionEndTime,
      totalDuration,
    };
  }

  /**
   * Export logs as JSON
   */
  exportJSON(filePath: string): void {
    const completeLog = this.getCompleteLog();
    const json = JSON.stringify(completeLog, null, 2);
    writeFileSync(filePath, json, 'utf-8');
  }

  /**
   * Export logs as CSV
   */
  exportCSV(filePath: string): void {
    const headers = [
      'Player Name',
      'Player ID',
      'Role',
      'Rating',
      'Base Price',
      'Min Price',
      'Max Price',
      'Final Price',
      'Winning Team',
      'Number of Bids',
      'Auction Duration (s)',
      'Status',
      'Unsold Reason',
    ];

    const rows = this.logs.map((entry) => [
      entry.playerName,
      entry.playerId,
      entry.playerRole,
      entry.playerRating.toString(),
      entry.basePrice.toFixed(2),
      entry.minPrice.toFixed(2),
      entry.maxPrice.toFixed(2),
      entry.finalPrice.toFixed(2),
      entry.winningTeam || '',
      entry.numberOfBids.toString(),
      entry.auctionDuration.toFixed(2),
      entry.status,
      entry.unsoldReason || '',
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    writeFileSync(filePath, csv, 'utf-8');
  }

  /**
   * Export detailed bid history as JSON
   */
  exportBidHistoryJSON(filePath: string): void {
    const bidHistory = this.logs.map((entry) => ({
      playerName: entry.playerName,
      playerId: entry.playerId,
      bidHistory: entry.bidHistory,
    }));

    const json = JSON.stringify(bidHistory, null, 2);
    writeFileSync(filePath, json, 'utf-8');
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    totalPlayers: number;
    totalSold: number;
    totalUnsold: number;
    totalRevenue: number;
    averagePrice: number;
    averageBids: number;
    averageDuration: number;
    soldAveragePrice: number;
    soldAverageBids: number;
    soldAverageDuration: number;
  } {
    const completeLog = this.getCompleteLog();
    const soldEntries = this.logs.filter((entry) => entry.status === 'SOLD');

    const averagePrice =
      this.logs.length > 0
        ? this.logs.reduce((sum, entry) => sum + entry.finalPrice, 0) / this.logs.length
        : 0;

    const averageBids =
      this.logs.length > 0
        ? this.logs.reduce((sum, entry) => sum + entry.numberOfBids, 0) / this.logs.length
        : 0;

    const averageDuration =
      this.logs.length > 0
        ? this.logs.reduce((sum, entry) => sum + entry.auctionDuration, 0) / this.logs.length
        : 0;

    const soldAveragePrice =
      soldEntries.length > 0
        ? soldEntries.reduce((sum, entry) => sum + entry.finalPrice, 0) / soldEntries.length
        : 0;

    const soldAverageBids =
      soldEntries.length > 0
        ? soldEntries.reduce((sum, entry) => sum + entry.numberOfBids, 0) / soldEntries.length
        : 0;

    const soldAverageDuration =
      soldEntries.length > 0
        ? soldEntries.reduce((sum, entry) => sum + entry.auctionDuration, 0) / soldEntries.length
        : 0;

    return {
      totalPlayers: completeLog.totalPlayers,
      totalSold: completeLog.totalSold,
      totalUnsold: completeLog.totalUnsold,
      totalRevenue: completeLog.totalRevenue,
      averagePrice,
      averageBids,
      averageDuration,
      soldAveragePrice,
      soldAverageBids,
      soldAverageDuration,
    };
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    this.currentEntry = null;
    this.auctionStartTime = 0;
    this.bidCount = 0;
    this.bidHistory = [];
    this.playerStartTime = 0;
  }
}

/**
 * Create and attach a logger to an auction engine
 *
 * @param engine - Auction engine to attach logger to
 * @returns AuctionLogger instance
 */
export function createAuctionLogger(engine: AuctionEngine): AuctionLogger {
  const logger = new AuctionLogger();
  logger.attach(engine);
  return logger;
}

/**
 * Create and attach a logger to an auction manager's engine
 *
 * @param manager - Auction manager with engine
 * @returns AuctionLogger instance
 */
export function createAuctionLoggerForManager(manager: { getEngine(): AuctionEngine }): AuctionLogger {
  const logger = new AuctionLogger();
  logger.attach(manager.getEngine());
  return logger;
}

