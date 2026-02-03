// Standings types for tournament standings pages

export interface StandingsFilters {
  season_id?: number;
  sport_id?: number;
  esport_category_id?: number;
  stage_id?: number;
}

export interface StandingsNavigation {
  season: {
    id: number;
    name: string;
    start_at: string;
    end_at: string;
  };
  sport: {
    id: number;
    name: string;
  };
  category: {
    id: number;
    division: string;
    levels: string;
    display_name: string;
  };
  stages: Array<{
    id: number;
    name: string;
    competition_stage: string;
    stage_type?: 'round_robin' | 'single_elimination' | 'double_elimination';
    order: number;
  }>;
}

export interface TeamStanding {
  team_id: string;
  team_name: string;
  school_name: string;
  school_abbreviation: string;
  school_logo_url: string | null;
  matches_played: number;
  wins: number;
  losses: number;
  draws: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  position: number;
}

export interface GroupStageStandings {
  stage_id: number;
  stage_name: string;
  competition_stage: 'group_stage';
  groups: Array<{
    group_name?: string;
    teams: TeamStanding[];
  }>;
}

export interface BracketTeam {
  team_id: string;
  team_name: string;
  school_name: string;
  school_abbreviation: string;
  school_logo_url: string | null;
  score: number | null;
}

export interface BracketMatch {
  match_id: number;
  match_name: string;
  round: number;
  position: number;
  team1: BracketTeam | null;
  team2: BracketTeam | null;
  winner: BracketTeam | null;
  match_status: 'upcoming' | 'live' | 'finished' | 'canceled';
  scheduled_at: string;
  venue: string;
  group_name?: string | null;
}

export interface BracketStandings {
  stage_id: number;
  stage_name: string;
  competition_stage: 'playoffs' | 'elimination';
  bracket: BracketMatch[];
}

export interface PlayinsMatch {
  match_id: number;
  match_name: string;
  team1: BracketTeam | null;
  team2: BracketTeam | null;
  winner: BracketTeam | null;
  match_status: 'upcoming' | 'live' | 'finished' | 'canceled';
  scheduled_at: string;
  venue: string;
}

export interface PlayinsStandings {
  stage_id: number;
  stage_name: string;
  competition_stage: 'playins';
  matches: PlayinsMatch[];
}

export type StandingsData = GroupStageStandings | BracketStandings | PlayinsStandings;

export interface StandingsResponse {
  navigation: StandingsNavigation;
  standings: StandingsData;
}
