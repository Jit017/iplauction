/// <reference types="node" />

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Player, PlayerRole } from './types';

// Declare Node.js globals for TypeScript
declare const __dirname: string;
declare const process: {
  cwd(): string;
  exit(code?: number): never;
};
declare const console: {
  log(...args: unknown[]): void;
  error(...args: unknown[]): void;
};

/**
 * CSV row interface
 */
interface CSVRow {
  Year: string;
  Player_Name: string;
  Matches_Batted: string;
  Not_Outs: string;
  Runs_Scored: string;
  Highest_Score: string;
  Batting_Average: string;
  Balls_Faced: string;
  Batting_Strike_Rate: string;
  Centuries: string;
  Half_Centuries: string;
  Fours: string;
  Sixes: string;
  Catches_Taken: string;
  Stumpings: string;
  Matches_Bowled: string;
  Balls_Bowled: string;
  Runs_Conceded: string;
  Wickets_Taken: string;
  Best_Bowling_Match: string;
  Bowling_Average: string;
  Economy_Rate: string;
  Bowling_Strike_Rate: string;
  Four_Wicket_Hauls: string;
  Five_Wicket_Hauls: string;
}

/**
 * Safely converts a value to a number, treating "No stats" and empty values as 0
 */
function toNumber(value: any): number {
  if (value === 'No stats' || value === '' || value == null) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Parses CSV file and returns rows
 */
function parseCSV(filePath: string): CSVRow[] {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((line: string) => line.trim());
  const headers = lines[0].split(',').map((h: string) => h.trim());

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: any = {};
    headers.forEach((header: string, index: number) => {
      row[header] = values[index]?.trim() || '';
    });
    rows.push(row as CSVRow);
  }

  return rows;
}

/**
 * Infers player role based on batting and bowling matches
 */
function inferRole(row: CSVRow): PlayerRole {
  const matchesBatted = toNumber(row.Matches_Batted);
  const matchesBowled = toNumber(row.Matches_Bowled);
  const stumpings = toNumber(row.Stumpings);

  // Wicket-keeper if has stumpings
  if (stumpings > 0) {
    if (matchesBatted >= 5) {
      return PlayerRole.WICKET_KEEPER_BATSMAN;
    }
    return PlayerRole.WICKET_KEEPER;
  }

  // All-rounder if both batting and bowling matches are significant
  if (matchesBatted >= 5 && matchesBowled >= 5) {
    return PlayerRole.ALL_ROUNDER;
  }

  // Bowler if primarily bowls
  if (matchesBowled > matchesBatted && matchesBowled >= 3) {
    return PlayerRole.BOWLER;
  }

  // Default to batsman
  return PlayerRole.BATSMAN;
}

/**
 * Calculates batting score
 */
function calculateBattingScore(row: CSVRow): number {
  const runs = toNumber(row.Runs_Scored);
  const average = toNumber(row.Batting_Average);
  const strikeRate = toNumber(row.Batting_Strike_Rate);
  const centuries = toNumber(row.Centuries);
  const halfCenturies = toNumber(row.Half_Centuries);
  const fours = toNumber(row.Fours);
  const sixes = toNumber(row.Sixes);
  const matches = toNumber(row.Matches_Batted);

  if (matches === 0) return 0;

  // Base score from runs and average
  let score = (runs / 10) * (average / 20);

  // Strike rate bonus (normalized to 100-200 range)
  const srBonus = Math.max(0, (strikeRate - 100) / 100) * 20;
  score += srBonus;

  // Milestone bonuses
  score += centuries * 50;
  score += halfCenturies * 20;

  // Boundary bonuses
  score += fours * 0.5;
  score += sixes * 1;

  // Match participation bonus
  score += matches * 2;

  return Math.max(0, score);
}

/**
 * Calculates bowling score
 */
function calculateBowlingScore(row: CSVRow): number {
  const wickets = toNumber(row.Wickets_Taken);
  const average = toNumber(row.Bowling_Average);
  const economy = toNumber(row.Economy_Rate);
  const strikeRate = toNumber(row.Bowling_Strike_Rate);
  const fourWicketHauls = toNumber(row.Four_Wicket_Hauls);
  const fiveWicketHauls = toNumber(row.Five_Wicket_Hauls);
  const matches = toNumber(row.Matches_Bowled);

  if (matches === 0) return 0;

  // Base score from wickets
  let score = wickets * 10;

  // Average bonus (lower is better, so invert)
  if (average > 0) {
    score += (50 / average) * 10;
  }

  // Economy bonus (lower is better)
  if (economy > 0) {
    score += (10 / economy) * 15;
  }

  // Strike rate bonus (lower is better)
  if (strikeRate > 0) {
    score += (20 / strikeRate) * 10;
  }

  // Haul bonuses
  score += fourWicketHauls * 30;
  score += fiveWicketHauls * 50;

  // Match participation bonus
  score += matches * 2;

  return Math.max(0, score);
}

/**
 * Calculates fielding bonus
 */
function calculateFieldingBonus(row: CSVRow): number {
  const catches = toNumber(row.Catches_Taken);
  const stumpings = toNumber(row.Stumpings);
  const matches = Math.max(
    toNumber(row.Matches_Batted),
    toNumber(row.Matches_Bowled)
  );

  if (matches === 0) return 0;

  // Catches and stumpings contribute to fielding score
  let bonus = catches * 2 + stumpings * 5;

  // Fielding consistency bonus
  bonus += (catches + stumpings) / matches * 10;

  return Math.max(0, bonus);
}

/**
 * Normalizes total score to 1-100 rating
 */
function normalizeRating(totalScore: number, minScore: number, maxScore: number): number {
  if (maxScore === minScore) return 50; // Default middle rating
  const normalized = ((totalScore - minScore) / (maxScore - minScore)) * 99 + 1;
  return Math.max(1, Math.min(100, Math.round(normalized)));
}

/**
 * Sets base price according to IPL rules
 * - 2 Cr for capped players
 * - 1 Cr for uncapped players
 */
function getBasePrice(isCapped: boolean): number {
  return isCapped ? 2.0 : 1.0;
}

/**
 * Derives minPrice and maxPrice from rating (for internal auction logic only)
 * These are not exposed to the UI
 */
function derivePriceRange(rating: number, basePrice: number): { minPrice: number; maxPrice: number } {
  // Min and max prices scale with rating
  // Higher rated players have wider price ranges
  
  let minPrice: number;
  let maxPrice: number;

  if (rating <= 20) {
    minPrice = basePrice * 0.3;
    maxPrice = basePrice * 5;
  } else if (rating <= 40) {
    minPrice = basePrice * 0.4;
    maxPrice = basePrice * 8;
  } else if (rating <= 60) {
    minPrice = basePrice * 0.5;
    maxPrice = basePrice * 12;
  } else if (rating <= 80) {
    minPrice = basePrice * 0.6;
    maxPrice = basePrice * 15;
  } else {
    minPrice = basePrice * 0.7;
    maxPrice = basePrice * 20;
  }

  // Round to 2 decimal places
  minPrice = Math.round(minPrice * 100) / 100;
  maxPrice = Math.round(maxPrice * 100) / 100;

  return { minPrice, maxPrice };
}

/**
 * Determines if player is capped (has played for national team)
 * This is inferred based on high performance metrics
 */
function isCapped(row: CSVRow, rating: number): boolean {
  // High rating suggests international experience
  if (rating >= 70) return true;

  // Significant IPL experience with good stats
  const matches = Math.max(
    toNumber(row.Matches_Batted),
    toNumber(row.Matches_Bowled)
  );
  const runs = toNumber(row.Runs_Scored);
  const wickets = toNumber(row.Wickets_Taken);

  if (matches >= 50 && (runs >= 1000 || wickets >= 50)) return true;
  if (matches >= 30 && (runs >= 1500 || wickets >= 75)) return true;

  return false;
}

/**
 * Calculates popularity based on performance metrics
 */
function calculatePopularity(row: CSVRow): number {
  const runs = toNumber(row.Runs_Scored);
  const wickets = toNumber(row.Wickets_Taken);
  const centuries = toNumber(row.Centuries);
  const fiveWicketHauls = toNumber(row.Five_Wicket_Hauls);
  const matches = Math.max(
    toNumber(row.Matches_Batted),
    toNumber(row.Matches_Bowled)
  );

  let popularity = 0;

  // Runs-based popularity
  if (runs > 0) {
    popularity += Math.min(40, runs / 50);
  }

  // Wickets-based popularity
  if (wickets > 0) {
    popularity += Math.min(40, wickets * 2);
  }

  // Milestone bonuses
  popularity += centuries * 5;
  popularity += fiveWicketHauls * 10;

  // Experience bonus
  popularity += Math.min(20, matches * 0.5);

  return Math.max(1, Math.min(100, Math.round(popularity)));
}

/**
 * Generates a unique ID for a player
 */
function generatePlayerId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Main conversion function
 */
function convertCSVToPlayers(csvPath: string): Player[] {
  console.log('Loading CSV file...');
  const rows = parseCSV(csvPath);
  console.log(`Loaded ${rows.length} rows`);

  // Filter out rows with no year or "No stats" for all fields
  const validRows = rows.filter((row) => {
    const year = toNumber(row.Year);
    const hasStats =
      toNumber(row.Matches_Batted) > 0 || toNumber(row.Matches_Bowled) > 0;
    return year > 0 && hasStats;
  });

  console.log(`Filtered to ${validRows.length} valid rows`);

  // Group by player name and select latest year
  console.log('Grouping by player and selecting latest year...');
  const latestByPlayer = new Map<string, CSVRow>();

  for (const row of validRows) {
    const playerName = row.Player_Name.trim();
    if (!playerName) continue;

    const year = toNumber(row.Year);
    const prev = latestByPlayer.get(playerName);

    if (!prev || year > toNumber(prev.Year)) {
      latestByPlayer.set(playerName, row);
    }
  }

  console.log(`Found ${latestByPlayer.size} unique players`);

  // Convert to Player objects
  console.log('Converting to Player objects...');
  const players: Player[] = [];
  const scores: number[] = [];

  for (const [playerName, row] of latestByPlayer.entries()) {
    const battingScore = calculateBattingScore(row);
    const bowlingScore = calculateBowlingScore(row);
    const fieldingBonus = calculateFieldingBonus(row);
    const totalScore = battingScore + bowlingScore + fieldingBonus;

    scores.push(totalScore);
  }

  // Calculate min and max scores for normalization
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  console.log(`Score range: ${minScore.toFixed(2)} - ${maxScore.toFixed(2)}`);

  // Create Player objects with normalized ratings
  for (const [playerName, row] of latestByPlayer.entries()) {
    const battingScore = calculateBattingScore(row);
    const bowlingScore = calculateBowlingScore(row);
    const fieldingBonus = calculateFieldingBonus(row);
    const totalScore = battingScore + bowlingScore + fieldingBonus;

    const rating = normalizeRating(totalScore, minScore, maxScore);
    const popularity = calculatePopularity(row);
    const capped = isCapped(row, rating);
    const role = inferRole(row);
    
    // Set base price according to IPL rules (2 Cr for capped, 1 Cr for uncapped)
    const basePrice = getBasePrice(capped);
    
    // Derive min/max prices for internal auction logic (not exposed to UI)
    const { minPrice, maxPrice } = derivePriceRange(rating, basePrice);

    const player: Player = {
      id: generatePlayerId(playerName),
      name: playerName,
      role,
      basePrice,
      minPrice,
      maxPrice,
      rating,
      popularity,
      isCapped: capped,
    };

    players.push(player);
  }

  // Sort by rating (descending)
  players.sort((a, b) => b.rating - a.rating);

  console.log(`Generated ${players.length} players`);
  console.log(
    `Rating range: ${Math.min(...players.map((p) => p.rating))} - ${Math.max(...players.map((p) => p.rating))}`
  );

  return players;
}

/**
 * Generates TypeScript file with Player array
 */
function generateTypeScriptFile(players: Player[], outputPath: string): void {
  const imports = `import { Player, PlayerRole } from './types';\n\n`;
  const exportStatement = `export const players: Player[] = [\n`;
  
  // Generate player objects with proper enum references
  const playerStrings = players.map(p => {
    const roleMap: { [key: string]: string } = {
      'Batsman': 'PlayerRole.BATSMAN',
      'Bowler': 'PlayerRole.BOWLER',
      'All-rounder': 'PlayerRole.ALL_ROUNDER',
      'Wicket-keeper': 'PlayerRole.WICKET_KEEPER',
      'Wicket-keeper Batsman': 'PlayerRole.WICKET_KEEPER_BATSMAN'
    };
    
    const roleEnum = roleMap[p.role] || `"${p.role}"`;
    
    return `  {\n    id: "${p.id}",\n    name: "${p.name}",\n    role: ${roleEnum},\n    basePrice: ${p.basePrice},\n    minPrice: ${p.minPrice},\n    maxPrice: ${p.maxPrice},\n    rating: ${p.rating},\n    popularity: ${p.popularity},\n    isCapped: ${p.isCapped}\n  }`;
  });
  
  const fullContent = imports + exportStatement + playerStrings.join(',\n') + '\n];\n';

  writeFileSync(outputPath, fullContent, 'utf-8');
  console.log(`Generated TypeScript file: ${outputPath}`);
}

/**
 * Main execution
 */
function main() {
  // Get directory from current file location or use process.cwd()
  const baseDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
  const csvPath = join(baseDir, 'cricket_data_2025.csv');
  const outputPath = join(baseDir, 'players.ts');

  if (!existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    console.error('Please ensure cricket_data_2025.csv is in the project root');
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
    return;
  }

  try {
    const players = convertCSVToPlayers(csvPath);
    generateTypeScriptFile(players, outputPath);
    console.log('Conversion completed successfully!');
    console.log(`Generated ${players.length} players in ${outputPath}`);
  } catch (error) {
    console.error('Error during conversion:', error);
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
    throw error;
  }
}

// Run if executed directly
main();

export { convertCSVToPlayers, generateTypeScriptFile };

