/**
 * Enhanced Statistics Types
 * Types for the comprehensive statistics page with hero/agent, map, and team stats
 */

import { Database } from '@/database.types';

// Base player stats from the database
export type StatsMlbbGamePlayer = Database['public']['Tables']['stats_mlbb_game_player']['Row'];
export type StatsValorantGamePlayer = Database['public']['Tables']['stats_valorant_game_player']['Row'];

// ============================================
// Filter Types
// ============================================

export interface StatisticsFiltersExtended {
    game: 'mlbb' | 'valorant';
    seasonId?: number;
    stageId?: number;
    categoryId?: number;
    teamId?: string;
    searchQuery?: string;
}

export interface FilterOption {
    id: number | string;
    label: string;
    value: string | number;
}

// ============================================
// Hero Stats (MLBB)
// ============================================

export interface HeroStats {
    hero_name: string;
    icon_url?: string | null; // For future icon support
    games_played: number;
    total_picks: number;
    pick_rate: number; // percentage
    total_wins: number;
    win_rate: number; // percentage
    total_kills: number;
    total_deaths: number;
    total_assists: number;
    avg_kills: number;
    avg_deaths: number;
    avg_assists: number;
    avg_kda: number;
    avg_gold: number;
    avg_damage_dealt: number;
    avg_damage_taken: number;
    avg_turret_damage: number;
}

// ============================================
// Agent Stats (Valorant)
// ============================================

export type AgentRole = 'duelist' | 'initiator' | 'controller' | 'sentinel';

export interface AgentStats {
    agent_name: string;
    icon_url?: string | null; // For future icon support
    role?: AgentRole;
    games_played: number;
    total_picks: number;
    pick_rate: number; // percentage
    total_wins: number;
    win_rate: number; // percentage
    total_kills: number;
    total_deaths: number;
    total_assists: number;
    avg_kills: number;
    avg_deaths: number;
    avg_assists: number;
    avg_kda: number;
    avg_acs: number;
    total_first_bloods: number;
    avg_first_bloods: number;
}

// Agent role mapping
export const AGENT_ROLES: Record<string, AgentRole> = {
    // Duelists
    'Jett': 'duelist',
    'Phoenix': 'duelist',
    'Reyna': 'duelist',
    'Raze': 'duelist',
    'Yoru': 'duelist',
    'Neon': 'duelist',
    'Iso': 'duelist',
    // Initiators
    'Breach': 'initiator',
    'Skye': 'initiator',
    'Sova': 'initiator',
    'KAY/O': 'initiator',
    'Fade': 'initiator',
    'Gekko': 'initiator',
    // Controllers
    'Brimstone': 'controller',
    'Omen': 'controller',
    'Viper': 'controller',
    'Astra': 'controller',
    'Harbor': 'controller',
    'Clove': 'controller',
    // Sentinels
    'Killjoy': 'sentinel',
    'Cypher': 'sentinel',
    'Sage': 'sentinel',
    'Chamber': 'sentinel',
    'Deadlock': 'sentinel',
    'Vyse': 'sentinel',
};

// ============================================
// Map Stats (Valorant)
// ============================================

export interface MapStats {
    map_id: number;
    map_name: string;
    splash_image_url?: string | null;
    total_games: number;
    total_picks: number;
    pick_rate: number; // percentage
    total_bans: number;
    ban_rate: number; // percentage
    attack_wins: number;
    defense_wins: number;
    attack_win_rate: number; // percentage
    defense_win_rate: number; // percentage
}

// ============================================
// Team Stats
// ============================================

export interface TeamStats {
    team_id: string;
    team_name: string;
    team_logo_url?: string | null;
    school_name: string;
    school_abbreviation: string;
    school_logo_url?: string | null;
    games_played: number;
    total_wins: number;
    total_losses: number;
    win_rate: number; // percentage
    total_kills: number;
    total_deaths: number;
    total_assists: number;
    avg_kills_per_game: number;
    avg_deaths_per_game: number;
    avg_assists_per_game: number;
    // MLBB specific
    avg_gold_per_game?: number;
    avg_damage_per_game?: number;
    total_turret_damage?: number;
    total_lord_slain?: number;
    total_turtle_slain?: number;
    // Valorant specific
    avg_acs?: number;
    total_first_bloods?: number;
    total_plants?: number;
    total_defuses?: number;
}

// ============================================
// Enhanced Player Stats (with additional fields)
// ============================================

export interface EnhancedPlayerStats {
    player_id: string;
    player_ign: string;
    player_photo_url?: string | null;
    team_id: string | null;
    team_name?: string | null;
    team_logo_url?: string | null;
    school_name?: string | null;
    school_abbreviation?: string | null;
    games_played: number;
    total_kills: number;
    total_deaths: number;
    total_assists: number;
    kills_per_game: number;
    deaths_per_game: number;
    assists_per_game: number;
    kda_ratio: number;
    mvp_count: number;
}

export interface EnhancedMlbbPlayerStats extends EnhancedPlayerStats {
    most_played_hero: string | null;
    hero_icon_url?: string | null;
    total_gold: number;
    avg_gpm: number;
    total_damage_dealt: number;
    total_damage_taken: number;
    total_turret_damage: number;
    avg_damage_per_game: number;
}

export interface EnhancedValorantPlayerStats extends EnhancedPlayerStats {
    most_played_agent: string | null;
    agent_icon_url?: string | null;
    agent_role?: AgentRole;
    avg_acs: number;
    total_first_bloods: number;
    first_bloods_per_game: number;
}

// ============================================
// API Response Types
// ============================================

export interface StatisticsPageData {
    players: EnhancedMlbbPlayerStats[] | EnhancedValorantPlayerStats[];
    heroes?: HeroStats[];
    agents?: AgentStats[];
    maps?: MapStats[];
    teams: TeamStats[];
    filters: {
        seasons: FilterOption[];
        stages: FilterOption[];
        categories: FilterOption[];
    };
}

// ============================================
// Leaderboard Types
// ============================================

export type LeaderboardMetric =
    // Common metrics
    | 'kills_per_game'
    | 'kda_ratio'
    | 'mvp_count'
    | 'games_played'
    // MLBB metrics
    | 'avg_gpm'
    | 'avg_damage_per_game'
    | 'total_turret_damage'
    // Valorant metrics
    | 'avg_acs'
    | 'first_bloods_per_game';

export interface LeaderboardConfig {
    metric: LeaderboardMetric;
    label: string;
    description: string;
    format: 'number' | 'decimal' | 'percentage';
    game: 'mlbb' | 'valorant' | 'both';
}

export const LEADERBOARD_METRICS: LeaderboardConfig[] = [
    // Common
    { metric: 'kills_per_game', label: 'Kills Per Game', description: 'Average kills per game', format: 'decimal', game: 'both' },
    { metric: 'kda_ratio', label: 'KDA Ratio', description: 'Kill/Death/Assist ratio', format: 'decimal', game: 'both' },
    { metric: 'mvp_count', label: 'MVP Awards', description: 'Total MVP awards', format: 'number', game: 'both' },
    // MLBB
    { metric: 'avg_gpm', label: 'Gold Per Minute', description: 'Average gold earned per minute', format: 'number', game: 'mlbb' },
    { metric: 'avg_damage_per_game', label: 'Damage Per Game', description: 'Average damage dealt per game', format: 'number', game: 'mlbb' },
    { metric: 'total_turret_damage', label: 'Turret Damage', description: 'Total damage to turrets', format: 'number', game: 'mlbb' },
    // Valorant
    { metric: 'avg_acs', label: 'Average Combat Score', description: 'Average ACS per game', format: 'number', game: 'valorant' },
    { metric: 'first_bloods_per_game', label: 'First Bloods', description: 'Average first bloods per game', format: 'decimal', game: 'valorant' },
];

// ============================================
// Stat View Type
// ============================================

export type StatisticsViewType = 'players' | 'heroes' | 'agents' | 'maps' | 'teams';

export const STATISTICS_VIEWS: {
    type: StatisticsViewType;
    label: string;
    mlbb: boolean;
    valorant: boolean;
}[] = [
        { type: 'players', label: 'Players', mlbb: true, valorant: true },
        { type: 'heroes', label: 'Heroes', mlbb: true, valorant: false },
        { type: 'agents', label: 'Agents', mlbb: false, valorant: true },
        { type: 'maps', label: 'Maps', mlbb: false, valorant: true },
        { type: 'teams', label: 'Teams', mlbb: true, valorant: true },
    ];
