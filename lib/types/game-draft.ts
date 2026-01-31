// Type definitions for game hero draft system

import { Database } from '@/database.types';

// Hero bans from database
export type GameHeroBan = Database['public']['Tables']['game_hero_bans']['Row'];
export type GameHeroBanInsert = Database['public']['Tables']['game_hero_bans']['Insert'];
export type GameHeroBanUpdate = Database['public']['Tables']['game_hero_bans']['Update'];

// Game character (hero) from database
export type GameCharacter = Database['public']['Tables']['game_characters']['Row'];

// Extended types for draft UI
export interface DraftCharacter extends GameCharacter {
  isBanned: boolean;
  isPicked: boolean;
  bannedByTeam?: string;
  pickedByTeam?: string;
  pickOrder?: number;
  banOrder?: number;
}

// Draft phase definitions for MLBB
export type DraftPhase = 
  | 'pre-draft'
  | 'ban-phase-1'    // First ban phase (3 bans each)
  | 'pick-phase-1'   // First pick phase
  | 'ban-phase-2'    // Second ban phase (2 bans each)
  | 'pick-phase-2'   // Second pick phase
  | 'completed';

// Draft state for real-time synchronization
export interface DraftState {
  gameId: number;
  matchId: number;
  phase: DraftPhase;
  currentTurn: 'team1' | 'team2';
  team1Id: string;
  team2Id: string;
  team1Bans: GameHeroBan[];
  team2Bans: GameHeroBan[];
  team1Picks: string[]; // Hero names
  team2Picks: string[]; // Hero names
  timer: number;
  isActive: boolean;
}

// MLBB Draft sequence (standard MPL format)
// Ban Phase 1: Team1, Team2, Team1, Team2, Team1, Team2 (3 each)
// Pick Phase 1: Team1, Team2, Team2, Team1, Team1, Team2 (1-2-2-1 format)
// Ban Phase 2: Team2, Team1, Team2, Team1 (2 each)
// Pick Phase 2: Team2, Team1, Team1, Team2 (remaining picks)
export const MLBB_DRAFT_SEQUENCE: Array<{
  action: 'ban' | 'pick';
  team: 'team1' | 'team2';
  phase: DraftPhase;
}> = [
  // Ban Phase 1
  { action: 'ban', team: 'team1', phase: 'ban-phase-1' },
  { action: 'ban', team: 'team2', phase: 'ban-phase-1' },
  { action: 'ban', team: 'team1', phase: 'ban-phase-1' },
  { action: 'ban', team: 'team2', phase: 'ban-phase-1' },
  { action: 'ban', team: 'team1', phase: 'ban-phase-1' },
  { action: 'ban', team: 'team2', phase: 'ban-phase-1' },
  // Pick Phase 1
  { action: 'pick', team: 'team1', phase: 'pick-phase-1' },
  { action: 'pick', team: 'team2', phase: 'pick-phase-1' },
  { action: 'pick', team: 'team2', phase: 'pick-phase-1' },
  { action: 'pick', team: 'team1', phase: 'pick-phase-1' },
  { action: 'pick', team: 'team1', phase: 'pick-phase-1' },
  { action: 'pick', team: 'team2', phase: 'pick-phase-1' },
  // Ban Phase 2
  { action: 'ban', team: 'team2', phase: 'ban-phase-2' },
  { action: 'ban', team: 'team1', phase: 'ban-phase-2' },
  { action: 'ban', team: 'team2', phase: 'ban-phase-2' },
  { action: 'ban', team: 'team1', phase: 'ban-phase-2' },
  // Pick Phase 2
  { action: 'pick', team: 'team2', phase: 'pick-phase-2' },
  { action: 'pick', team: 'team1', phase: 'pick-phase-2' },
  { action: 'pick', team: 'team1', phase: 'pick-phase-2' },
  { action: 'pick', team: 'team2', phase: 'pick-phase-2' },
];

// Helper to get current draft step
export function getCurrentDraftStep(draftState: DraftState): number {
  const totalBans = draftState.team1Bans.length + draftState.team2Bans.length;
  const totalPicks = draftState.team1Picks.length + draftState.team2Picks.length;
  return totalBans + totalPicks;
}

// Helper to get next action in sequence
export function getNextDraftAction(draftState: DraftState) {
  const currentStep = getCurrentDraftStep(draftState);
  if (currentStep >= MLBB_DRAFT_SEQUENCE.length) {
    return null; // Draft complete
  }
  return MLBB_DRAFT_SEQUENCE[currentStep];
}
