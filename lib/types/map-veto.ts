// Type definitions for Valorant map veto system

import { Database } from '@/database.types';

// Map vetoes from database
export type ValorantMapVeto = Database['public']['Tables']['valorant_map_vetoes']['Row'];
export type ValorantMapVetoInsert = Database['public']['Tables']['valorant_map_vetoes']['Insert'];
export type ValorantMapVetoUpdate = Database['public']['Tables']['valorant_map_vetoes']['Update'];

// Valorant maps from database
export type ValorantMap = Database['public']['Tables']['valorant_maps']['Row'];

// Enum types
export type VetoAction = Database['public']['Enums']['veto_action']; // 'pick' | 'ban' | 'remain'
export type GameSide = Database['public']['Enums']['game_side']; // 'attack' | 'defense'

// Extended types for UI
export interface ValorantMapVetoWithTeam extends ValorantMapVeto {
  schools_teams: {
    id: string;
    name: string;
    schools: {
      id: string;
      name: string;
      abbreviation: string;
      logo_url: string | null;
    } | null;
  } | null;
}

// Map with veto status for UI display
export interface MapWithVetoStatus extends ValorantMap {
  vetoStatus: 'available' | 'banned' | 'picked' | 'remaining';
  vetoedByTeam?: string;
  selectedSide?: GameSide | null;
  sequenceOrder?: number;
}

// Veto state for real-time synchronization
export interface MapVetoState {
  matchId: number;
  vetoes: ValorantMapVetoWithTeam[];
  currentStep: number;
  isComplete: boolean;
  team1Id: string;
  team2Id: string;
  maps: ValorantMap[];
}

// Standard Valorant veto sequence for Bo1 (7 maps -> 6 bans, 1 play)
// Team1 Ban, Team2 Ban, Team1 Ban, Team2 Ban, Team1 Ban, Team2 Ban, Remaining
export const BO1_VETO_SEQUENCE: Array<{
  action: VetoAction;
  team: 'team1' | 'team2' | 'none';
  description: string;
}> = [
    { action: 'ban', team: 'team1', description: 'Team 1 bans' },
    { action: 'ban', team: 'team2', description: 'Team 2 bans' },
    { action: 'ban', team: 'team1', description: 'Team 1 bans' },
    { action: 'ban', team: 'team2', description: 'Team 2 bans' },
    { action: 'ban', team: 'team1', description: 'Team 1 bans' },
    { action: 'ban', team: 'team2', description: 'Team 2 bans' },
    { action: 'remain', team: 'none', description: 'Remaining map' },
  ];

// Standard Valorant veto sequence for Bo2
// Team1 Ban, Team2 Ban, Team1 Ban, Team2 Ban, Team1 Ban, Team2 Pick, Team 2 Pick
export const BO2_VETO_SEQUENCE: Array<{
  action: VetoAction;
  team: 'team1' | 'team2' | 'none';
  description: string;
}> = [
    { action: 'ban', team: 'team1', description: 'Team 1 bans' },
    { action: 'ban', team: 'team2', description: 'Team 2 bans' },
    { action: 'ban', team: 'team1', description: 'Team 1 bans' },
    { action: 'ban', team: 'team2', description: 'Team 2 bans' },
    { action: 'ban', team: 'team1', description: 'Team 1 bans' },
    { action: 'pick', team: 'team2', description: 'Team 2 picks' },
    { action: 'pick', team: 'team1', description: 'Team 1 picks' },
  ];

// Standard Valorant veto sequence for Bo3
// Team1 ban, Team2 ban, Team1 ban, Team2 ban, Team1 pick, Team2 pick, Team1 ban, Team2 ban, Remaining
export const BO3_VETO_SEQUENCE: Array<{
  action: VetoAction;
  team: 'team1' | 'team2' | 'none';
  description: string;
}> = [
    { action: 'ban', team: 'team1', description: 'Team 1 bans' },
    { action: 'ban', team: 'team2', description: 'Team 2 bans' },
    { action: 'pick', team: 'team1', description: 'Team 1 picks' },
    { action: 'pick', team: 'team2', description: 'Team 2 picks' },
    { action: 'ban', team: 'team1', description: 'Team 1 bans' },
    { action: 'ban', team: 'team2', description: 'Team 2 bans' },
    { action: 'remain', team: 'none', description: 'Remaining map' },
  ];

// Standard Valorant veto sequence for Bo5
// Team1 ban, Team2 ban, Team1 pick, Team2 pick, Team1 pick, Team2 pick, Remaining
export const BO5_VETO_SEQUENCE: Array<{
  action: VetoAction;
  team: 'team1' | 'team2' | 'none';
  description: string;
}> = [
    { action: 'ban', team: 'team1', description: 'Team 1 bans' },
    { action: 'ban', team: 'team2', description: 'Team 2 bans' },
    { action: 'pick', team: 'team1', description: 'Team 1 picks' },
    { action: 'pick', team: 'team2', description: 'Team 2 picks' },
    { action: 'pick', team: 'team1', description: 'Team 1 picks' },
    { action: 'pick', team: 'team2', description: 'Team 2 picks' },
    { action: 'remain', team: 'none', description: 'Remaining map' },
  ];

// Helper to get veto sequence based on match format
export function getVetoSequence(bestOf: number) {
  if (bestOf >= 5) return BO5_VETO_SEQUENCE;
  if (bestOf === 3) return BO3_VETO_SEQUENCE;
  if (bestOf === 2) return BO2_VETO_SEQUENCE;
  return BO1_VETO_SEQUENCE;
}

// Helper to get current veto step
export function getCurrentVetoStep(vetoes: ValorantMapVeto[], bestOf: number) {
  const sequence = getVetoSequence(bestOf);
  const currentStep = vetoes.length;

  if (currentStep >= sequence.length) {
    return null; // Veto complete
  }

  return {
    ...sequence[currentStep],
    stepNumber: currentStep + 1,
    totalSteps: sequence.length
  };
}
