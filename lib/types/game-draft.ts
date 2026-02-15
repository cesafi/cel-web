// Type definitions for game hero draft system

import { Database } from '@/database.types';

// Draft Action from database (Unified Bans & Picks)
export type GameDraftAction = Database['public']['Tables']['game_draft_actions']['Row'] & {
  player?: {
    id: string;
    ign: string;
    role: string | null;
  };
};
export type GameDraftActionInsert = Database['public']['Tables']['game_draft_actions']['Insert'];
export type GameDraftActionUpdate = Database['public']['Tables']['game_draft_actions']['Update'];

// Game character (hero) from database
export type GameCharacter = Database['public']['Tables']['game_characters']['Row'];

// Extended types for draft UI
export interface DraftCharacter extends GameCharacter {
  isBanned: boolean;
  isPicked: boolean;
  actionByTeam?: string; // Team ID
  actionType?: 'ban' | 'pick';
  sortOrder?: number;
}

// Draft phase definitions for MLBB
export type DraftPhase = 
  | 'pre-draft'
  | 'ban-phase-1'    // First ban phase (3 bans each)
  | 'pick-phase-1'   // First pick phase
  | 'ban-phase-2'    // Second ban phase (2 bans each)
  | 'pick-phase-2'   // Second pick phase
  | 'completed';

// Action Definition for Sequencing
export interface DraftSequenceStep {
  action: 'ban' | 'pick';
  team: 'team1' | 'team2';
  phase: DraftPhase;
  timer?: number; // Optional override for specific steps
}

// Draft state for real-time synchronization
export interface DraftState {
  gameId: number;
  matchId: number;
  // Current status derived from actions
  currentStepIndex: number; // 0-based index into sequence
  nextAction: DraftSequenceStep | null;
  
  team1Id: string;
  team2Id: string;
  
  // Lists for easy UI rendering
  actions: GameDraftAction[]; 
  team1Bans: GameDraftAction[];
  team2Bans: GameDraftAction[];
  team1Picks: GameDraftAction[];
  team2Picks: GameDraftAction[];
  
  isComplete: boolean;
}

// MLBB Draft sequence (standard MPL format)
// Ban Phase 1: Team1, Team2, Team1, Team2, Team1, Team2 (3 each)
// Pick Phase 1: Team1, Team2, Team2, Team1, Team1, Team2 (1-2-2-1 format)
// Ban Phase 2: Team2, Team1, Team2, Team1 (2 each)
// Pick Phase 2: Team2, Team1, Team1, Team2 (remaining picks)
export const MLBB_DRAFT_SEQUENCE: DraftSequenceStep[] = [
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

/**
 * Calculates the current state of the draft based on the actions log.
 */
export function calculateDraftState(
  gameId: number, 
  matchId: number,
  team1Id: string, 
  team2Id: string, 
  actions: GameDraftAction[]
): DraftState {
  const sortedActions = [...actions].sort((a, b) => a.sort_order - b.sort_order);
  const currentStepIndex = sortedActions.length;
  
  const team1Bans = sortedActions.filter(a => a.team_id === team1Id && a.action_type === 'ban');
  const team2Bans = sortedActions.filter(a => a.team_id === team2Id && a.action_type === 'ban');
  const team1Picks = sortedActions.filter(a => a.team_id === team1Id && a.action_type === 'pick');
  const team2Picks = sortedActions.filter(a => a.team_id === team2Id && a.action_type === 'pick');

  const nextAction = currentStepIndex < MLBB_DRAFT_SEQUENCE.length 
    ? MLBB_DRAFT_SEQUENCE[currentStepIndex] 
    : null;

  return {
    gameId,
    matchId,
    currentStepIndex,
    nextAction,
    team1Id,
    team2Id,
    actions: sortedActions,
    team1Bans,
    team2Bans,
    team1Picks,
    team2Picks,
    isComplete: nextAction === null
  };
}

