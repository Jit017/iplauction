/**
 * Example usage of AuctionLogger
 *
 * This file demonstrates how to use the auction logger
 * for debugging and realism analysis.
 */

import { AuctionEngine } from './auction-engine';
import { AuctionManager } from './auction-manager';
import { createAuctionLogger, createAuctionLoggerForManager } from './auction-logger';

/**
 * Example: Using logger with AuctionEngine
 */
export async function exampleWithEngine() {
  // Create engine and teams
  const teams = [/* your teams */];
  const engine = new AuctionEngine(teams);

  // Create and attach logger
  const logger = createAuctionLogger(engine);

  // Run auction...
  // (your auction logic here)

  // Export logs
  logger.exportJSON('auction-log.json');
  logger.exportCSV('auction-log.csv');
  logger.exportBidHistoryJSON('bid-history.json');

  // Get summary
  const summary = logger.getSummary();
  console.log('Auction Summary:', summary);
}

/**
 * Example: Using logger with AuctionManager
 */
export async function exampleWithManager() {
  // Create manager
  const teams = [/* your teams */];
  const engine = new AuctionEngine(teams);
  const players = [/* your players */];
  const manager = new AuctionManager(engine, players);

  // Create and attach logger
  const logger = createAuctionLoggerForManager(manager);

  // Run auction
  manager.start();

  // Wait for auction to complete...
  // (in real usage, you'd wait for completion event)

  // Export logs for analysis
  logger.exportJSON('auction-log.json');
  logger.exportCSV('auction-log.csv');

  // Get statistics
  const summary = logger.getSummary();
  console.log('Total Players:', summary.totalPlayers);
  console.log('Sold:', summary.totalSold);
  console.log('Unsold:', summary.totalUnsold);
  console.log('Total Revenue:', summary.totalRevenue);
  console.log('Average Price:', summary.averagePrice.toFixed(2));
  console.log('Average Bids per Player:', summary.averageBids.toFixed(2));
  console.log('Average Duration:', summary.averageDuration.toFixed(2), 'seconds');
}

/**
 * Example: Analyzing logs for realism
 */
export function analyzeLogs(logger: any) {
  const summary = logger.getSummary();
  const logs = logger.getLogs();

  // Check price realism
  const soldLogs = logs.filter((entry: any) => entry.status === 'SOLD');
  const overpriced = soldLogs.filter(
    (entry: any) => entry.finalPrice > entry.maxPrice
  );
  const underpriced = soldLogs.filter(
    (entry: any) => entry.finalPrice < entry.minPrice
  );

  console.log('Price Analysis:');
  console.log(`  Overpriced: ${overpriced.length}`);
  console.log(`  Underpriced: ${underpriced.length}`);

  // Check bidding patterns
  const highBidCount = logs.filter((entry: any) => entry.numberOfBids > 10);
  const lowBidCount = logs.filter((entry: any) => entry.numberOfBids < 3);

  console.log('Bidding Pattern Analysis:');
  console.log(`  High bid count (>10): ${highBidCount.length}`);
  console.log(`  Low bid count (<3): ${lowBidCount.length}`);

  // Check duration patterns
  const longAuctions = logs.filter((entry: any) => entry.auctionDuration > 60);
  const shortAuctions = logs.filter((entry: any) => entry.auctionDuration < 10);

  console.log('Duration Analysis:');
  console.log(`  Long auctions (>60s): ${longAuctions.length}`);
  console.log(`  Short auctions (<10s): ${shortAuctions.length}`);
}

