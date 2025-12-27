/**
 * IPL Teams Data
 * Central data file for all IPL teams participating in the auction
 */

import { Team, PlayerRole, RoleNeeds } from './types';

/**
 * Default role needs for teams (minimum requirements)
 */
const DEFAULT_ROLE_NEEDS: RoleNeeds = {
  [PlayerRole.BATSMAN]: 6,
  [PlayerRole.BOWLER]: 6,
  [PlayerRole.ALL_ROUNDER]: 2,
  [PlayerRole.WICKET_KEEPER]: 1,
  [PlayerRole.WICKET_KEEPER_BATSMAN]: 0, // Can count towards wicket-keeper
};

/**
 * List of all IPL teams with initial configuration
 */
export const teams: Team[] = [
  {
    id: 'mi',
    name: 'Mumbai Indians',
    purse: 100,
    aggression: 70,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
  {
    id: 'csk',
    name: 'Chennai Super Kings',
    purse: 100,
    aggression: 65,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
  {
    id: 'rcb',
    name: 'Royal Challengers Bangalore',
    purse: 100,
    aggression: 75,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
  {
    id: 'kkr',
    name: 'Kolkata Knight Riders',
    purse: 100,
    aggression: 60,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
  {
    id: 'dc',
    name: 'Delhi Capitals',
    purse: 100,
    aggression: 65,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
  {
    id: 'srh',
    name: 'Sunrisers Hyderabad',
    purse: 100,
    aggression: 68,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
  {
    id: 'rr',
    name: 'Rajasthan Royals',
    purse: 100,
    aggression: 72,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
  {
    id: 'pbks',
    name: 'Punjab Kings',
    purse: 100,
    aggression: 70,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
  {
    id: 'gt',
    name: 'Gujarat Titans',
    purse: 100,
    aggression: 68,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
  {
    id: 'lsg',
    name: 'Lucknow Super Giants',
    purse: 100,
    aggression: 70,
    overseasCount: 0,
    squad: [],
    retainedPlayers: [],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS },
  },
];

/**
 * Get a team by ID
 */
export function getTeamById(id: string): Team | undefined {
  return teams.find((team) => team.id === id);
}

/**
 * Get a team by name
 */
export function getTeamByName(name: string): Team | undefined {
  return teams.find((team) => team.name === name);
}

/**
 * Create a deep copy of teams array (useful for initialization)
 */
export function getInitialTeams(): Team[] {
  return teams.map((team) => ({
    ...team,
    squad: [...team.squad],
    retainedPlayers: [...team.retainedPlayers],
    roleNeeds: { ...DEFAULT_ROLE_NEEDS }, // Always use default role needs
  }));
}

