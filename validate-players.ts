/// <reference types="node" />

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Player } from './types';

// Declare Node.js globals for TypeScript
declare const __dirname: string;
declare const process: {
  cwd(): string;
  exit(code?: number): never;
};
declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
};

/**
 * Validation result interface
 */
interface ValidationResult {
  passed: boolean;
  anomalies: string[];
}

/**
 * Loads players from the generated players.ts file
 */
function loadPlayers(): Player[] {
  const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const playersPath = join(baseDir, 'players.ts');

  if (!existsSync(playersPath)) {
    console.error(`Players file not found: ${playersPath}`);
    console.error('Please run convert-csv-to-players.ts first to generate players.ts');
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
    throw new Error('Players file not found');
  }

  try {
    // Read the players.ts file
    const content = readFileSync(playersPath, 'utf-8');
    
    // Extract the players array from the file
    // The file should have: export const players: Player[] = [...];
    // We need to extract the JSON array part
    const arrayMatch = content.match(/export const players: Player\[\] = (\[[\s\S]*?\]);/);
    
    if (!arrayMatch) {
      throw new Error('Could not parse players array from players.ts. Make sure the file was generated correctly.');
    }

    let playersJson = arrayMatch[1];
    
    // Clean up any trailing commas or whitespace issues
    playersJson = playersJson.trim();
    
    // Parse the JSON array
    const players: Player[] = JSON.parse(playersJson);
    
    if (!Array.isArray(players)) {
      throw new Error('Parsed data is not an array');
    }
    
    return players;
  } catch (error) {
    console.error('Error loading players:', error);
    console.error('Make sure players.ts was generated correctly by running: npm run convert');
    throw error;
  }
}

/**
 * Prints top N players by rating
 */
function printTopPlayers(players: Player[], count: number = 15): void {
  const sorted = [...players].sort((a, b) => b.rating - a.rating);
  const topPlayers = sorted.slice(0, count);

  console.log('\n' + '='.repeat(100));
  console.log(`TOP ${count} PLAYERS BY RATING`);
  console.log('='.repeat(100));
  console.log(
    `${'Rank'.padEnd(6)}${'Name'.padEnd(30)}${'Rating'.padEnd(10)}${'Role'.padEnd(20)}${'Base Price'.padEnd(12)}${'Min Price'.padEnd(12)}${'Max Price'.padEnd(12)}${'Capped'.padEnd(8)}`
  );
  console.log('-'.repeat(100));

  topPlayers.forEach((player, index) => {
    const rank = (index + 1).toString().padEnd(6);
    const name = player.name.padEnd(30);
    const rating = player.rating.toString().padEnd(10);
    const role = player.role.padEnd(20);
    const basePrice = `${player.basePrice.toFixed(2)} Cr`.padEnd(12);
    const minPrice = `${player.minPrice.toFixed(2)} Cr`.padEnd(12);
    const maxPrice = `${player.maxPrice.toFixed(2)} Cr`.padEnd(12);
    const capped = (player.isCapped ? 'Yes' : 'No').padEnd(8);

    console.log(`${rank}${name}${rating}${role}${basePrice}${minPrice}${maxPrice}${capped}`);
  });
  console.log('='.repeat(100) + '\n');
}

/**
 * Prints bottom N players by rating
 */
function printBottomPlayers(players: Player[], count: number = 15): void {
  const sorted = [...players].sort((a, b) => a.rating - b.rating);
  const bottomPlayers = sorted.slice(0, count);

  console.log('='.repeat(100));
  console.log(`BOTTOM ${count} PLAYERS BY RATING`);
  console.log('='.repeat(100));
  console.log(
    `${'Rank'.padEnd(6)}${'Name'.padEnd(30)}${'Rating'.padEnd(10)}${'Role'.padEnd(20)}${'Base Price'.padEnd(12)}${'Min Price'.padEnd(12)}${'Max Price'.padEnd(12)}${'Capped'.padEnd(8)}`
  );
  console.log('-'.repeat(100));

  bottomPlayers.forEach((player, index) => {
    const rank = (index + 1).toString().padEnd(6);
    const name = player.name.padEnd(30);
    const rating = player.rating.toString().padEnd(10);
    const role = player.role.padEnd(20);
    const basePrice = `${player.basePrice.toFixed(2)} Cr`.padEnd(12);
    const minPrice = `${player.minPrice.toFixed(2)} Cr`.padEnd(12);
    const maxPrice = `${player.maxPrice.toFixed(2)} Cr`.padEnd(12);
    const capped = (player.isCapped ? 'Yes' : 'No').padEnd(8);

    console.log(`${rank}${name}${rating}${role}${basePrice}${minPrice}${maxPrice}${capped}`);
  });
  console.log('='.repeat(100) + '\n');
}

/**
 * Validates that players with rating > 90 have minPrice >= 15 Cr
 */
function validateHighRatedPlayers(players: Player[]): ValidationResult {
  const anomalies: string[] = [];
  const highRatedPlayers = players.filter((p) => p.rating > 90);

  highRatedPlayers.forEach((player) => {
    if (player.minPrice < 15) {
      anomalies.push(
        `Player "${player.name}" (Rating: ${player.rating}) has minPrice ${player.minPrice.toFixed(2)} Cr, which is below 15 Cr threshold`
      );
    }
  });

  return {
    passed: anomalies.length === 0,
    anomalies,
  };
}

/**
 * Validates that players with rating < 70 have maxPrice <= 10 Cr
 */
function validateLowRatedPlayers(players: Player[]): ValidationResult {
  const anomalies: string[] = [];
  const lowRatedPlayers = players.filter((p) => p.rating < 70);

  lowRatedPlayers.forEach((player) => {
    if (player.maxPrice > 10) {
      anomalies.push(
        `Player "${player.name}" (Rating: ${player.rating}) has maxPrice ${player.maxPrice.toFixed(2)} Cr, which exceeds 10 Cr threshold`
      );
    }
  });

  return {
    passed: anomalies.length === 0,
    anomalies,
  };
}

/**
 * Prints validation results
 */
function printValidationResults(
  highRatedResult: ValidationResult,
  lowRatedResult: ValidationResult
): void {
  console.log('='.repeat(100));
  console.log('VALIDATION RESULTS');
  console.log('='.repeat(100));

  // High rated players validation
  console.log('\n✓ High-Rated Players Check (Rating > 90, minPrice >= 15 Cr):');
  if (highRatedResult.passed) {
    console.log('  ✅ PASSED - All high-rated players have appropriate minPrice');
  } else {
    console.log(`  ❌ FAILED - Found ${highRatedResult.anomalies.length} anomaly(ies):`);
    highRatedResult.anomalies.forEach((anomaly, index) => {
      console.log(`    ${index + 1}. ${anomaly}`);
    });
  }

  // Low rated players validation
  console.log('\n✓ Low-Rated Players Check (Rating < 70, maxPrice <= 10 Cr):');
  if (lowRatedResult.passed) {
    console.log('  ✅ PASSED - All low-rated players have appropriate maxPrice');
  } else {
    console.log(`  ❌ FAILED - Found ${lowRatedResult.anomalies.length} anomaly(ies):`);
    lowRatedResult.anomalies.forEach((anomaly, index) => {
      console.log(`    ${index + 1}. ${anomaly}`);
    });
  }

  // Overall summary
  const allPassed = highRatedResult.passed && lowRatedResult.passed;
  console.log('\n' + '='.repeat(100));
  if (allPassed) {
    console.log('✅ ALL VALIDATIONS PASSED');
  } else {
    const totalAnomalies =
      highRatedResult.anomalies.length + lowRatedResult.anomalies.length;
    console.log(
      `❌ VALIDATION FAILED - Found ${totalAnomalies} total anomaly(ies)`
    );
  }
  console.log('='.repeat(100) + '\n');
}

/**
 * Prints summary statistics
 */
function printSummary(players: Player[]): void {
  const ratings = players.map((p) => p.rating);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const avgRating =
    ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

  const basePrices = players.map((p) => p.basePrice);
  const minBasePrice = Math.min(...basePrices);
  const maxBasePrice = Math.max(...basePrices);
  const avgBasePrice =
    basePrices.reduce((sum, p) => sum + p, 0) / basePrices.length;

  const highRatedCount = players.filter((p) => p.rating > 90).length;
  const lowRatedCount = players.filter((p) => p.rating < 70).length;
  const cappedCount = players.filter((p) => p.isCapped).length;

  console.log('='.repeat(100));
  console.log('PLAYER DATA SUMMARY');
  console.log('='.repeat(100));
  console.log(`Total Players: ${players.length}`);
  console.log(`\nRating Statistics:`);
  console.log(`  Min: ${minRating.toFixed(2)}`);
  console.log(`  Max: ${maxRating.toFixed(2)}`);
  console.log(`  Average: ${avgRating.toFixed(2)}`);
  console.log(`  High-rated (>90): ${highRatedCount}`);
  console.log(`  Low-rated (<70): ${lowRatedCount}`);
  console.log(`\nBase Price Statistics:`);
  console.log(`  Min: ${minBasePrice.toFixed(2)} Cr`);
  console.log(`  Max: ${maxBasePrice.toFixed(2)} Cr`);
  console.log(`  Average: ${avgBasePrice.toFixed(2)} Cr`);
  console.log(`\nOther Statistics:`);
  console.log(`  Capped Players: ${cappedCount} (${((cappedCount / players.length) * 100).toFixed(1)}%)`);
  console.log('='.repeat(100) + '\n');
}

/**
 * Main validation function
 */
function main(): void {
  console.log('\n🔍 IPL Player Data Validation\n');

  try {
    // Load players
    console.log('Loading players from players.ts...');
    const players = loadPlayers();
    console.log(`✓ Loaded ${players.length} players\n`);

    // Print summary
    printSummary(players);

    // Print top and bottom players
    printTopPlayers(players, 15);
    printBottomPlayers(players, 15);

    // Run validations
    console.log('Running validations...\n');
    const highRatedResult = validateHighRatedPlayers(players);
    const lowRatedResult = validateLowRatedPlayers(players);

    // Print validation results
    printValidationResults(highRatedResult, lowRatedResult);

    // Exit with appropriate code
    const allPassed =
      highRatedResult.passed && lowRatedResult.passed;
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(allPassed ? 0 : 1);
    }
  } catch (error) {
    console.error('Validation failed with error:', error);
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
    throw error;
  }
}

// Run validation
main();

