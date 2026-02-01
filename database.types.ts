export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      _migration_mlbb_games: {
        Row: {
          new_game_id: number | null
          old_game_id: string
          old_series_id: string | null
          team_a_status: string | null
          team_b_status: string | null
        }
        Insert: {
          new_game_id?: number | null
          old_game_id: string
          old_series_id?: string | null
          team_a_status?: string | null
          team_b_status?: string | null
        }
        Update: {
          new_game_id?: number | null
          old_game_id?: string
          old_series_id?: string | null
          team_a_status?: string | null
          team_b_status?: string | null
        }
        Relationships: []
      }
      _migration_series_to_matches: {
        Row: {
          new_match_id: number | null
          old_series_id: string
        }
        Insert: {
          new_match_id?: number | null
          old_series_id: string
        }
        Update: {
          new_match_id?: number | null
          old_series_id?: string
        }
        Relationships: []
      }
      _migration_valo_games: {
        Row: {
          new_game_id: number | null
          old_game_id: string
          old_series_id: string | null
          team_a_rounds: number | null
          team_b_rounds: number | null
        }
        Insert: {
          new_game_id?: number | null
          old_game_id: string
          old_series_id?: string | null
          team_a_rounds?: number | null
          team_b_rounds?: number | null
        }
        Update: {
          new_game_id?: number | null
          old_game_id?: string
          old_series_id?: string | null
          team_a_rounds?: number | null
          team_b_rounds?: number | null
        }
        Relationships: []
      }
      _old_mlbb_games_migration: {
        Row: {
          created_at: string | null
          id: string
          match_duration: string | null
          match_number: number | null
          series_id: string | null
          team_a_status: string | null
          team_b_status: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          match_duration?: string | null
          match_number?: number | null
          series_id?: string | null
          team_a_status?: string | null
          team_b_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_duration?: string | null
          match_number?: number | null
          series_id?: string | null
          team_a_status?: string | null
          team_b_status?: string | null
        }
        Relationships: []
      }
      _old_players_migration: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          ingame_name: string | null
          is_active: boolean | null
          last_name: string | null
          old_team_id: string | null
          picture_url: string | null
          platform_id: string | null
          roles: string[] | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id: string
          ingame_name?: string | null
          is_active?: boolean | null
          last_name?: string | null
          old_team_id?: string | null
          picture_url?: string | null
          platform_id?: string | null
          roles?: string[] | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          ingame_name?: string | null
          is_active?: boolean | null
          last_name?: string | null
          old_team_id?: string | null
          picture_url?: string | null
          platform_id?: string | null
          roles?: string[] | null
        }
        Relationships: []
      }
      _old_series_migration: {
        Row: {
          created_at: string | null
          end_time: string | null
          id: string
          league_schedule_id: string | null
          match_number: number | null
          platform_id: string | null
          series_type: string | null
          start_time: string | null
          status: string | null
          team_a_id: string | null
          team_a_score: number | null
          team_a_status: string | null
          team_b_id: string | null
          team_b_score: number | null
          team_b_status: string | null
          week: number | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          id: string
          league_schedule_id?: string | null
          match_number?: number | null
          platform_id?: string | null
          series_type?: string | null
          start_time?: string | null
          status?: string | null
          team_a_id?: string | null
          team_a_score?: number | null
          team_a_status?: string | null
          team_b_id?: string | null
          team_b_score?: number | null
          team_b_status?: string | null
          week?: number | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          id?: string
          league_schedule_id?: string | null
          match_number?: number | null
          platform_id?: string | null
          series_type?: string | null
          start_time?: string | null
          status?: string | null
          team_a_id?: string | null
          team_a_score?: number | null
          team_a_status?: string | null
          team_b_id?: string | null
          team_b_score?: number | null
          team_b_status?: string | null
          week?: number | null
        }
        Relationships: []
      }
      _old_valo_games_migration: {
        Row: {
          created_at: string | null
          id: string
          map_id: string | null
          match_duration: string | null
          match_number: number | null
          series_id: string | null
          team_a_rounds: number | null
          team_a_status: string | null
          team_b_rounds: number | null
          team_b_status: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          map_id?: string | null
          match_duration?: string | null
          match_number?: number | null
          series_id?: string | null
          team_a_rounds?: number | null
          team_a_status?: string | null
          team_b_rounds?: number | null
          team_b_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          map_id?: string | null
          match_duration?: string | null
          match_number?: number | null
          series_id?: string | null
          team_a_rounds?: number | null
          team_a_status?: string | null
          team_b_rounds?: number | null
          team_b_status?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          authored_by: string
          content: Json
          cover_image_url: string
          created_at: string
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at: string
        }
        Insert: {
          authored_by: string
          content: Json
          cover_image_url: string
          created_at?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          title: string
          updated_at?: string
        }
        Update: {
          authored_by?: string
          content?: Json
          cover_image_url?: string
          created_at?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cesafi_timeline: {
        Row: {
          category: string
          created_at: string
          description: string
          id: number
          image_url: string
          is_highlight: boolean
          title: string
          updated_at: string | null
          year: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: number
          image_url: string
          is_highlight?: boolean
          title: string
          updated_at?: string | null
          year: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: number
          image_url?: string
          is_highlight?: boolean
          title?: string
          updated_at?: string | null
          year?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      esports: {
        Row: {
          abbreviation: string | null
          created_at: string
          id: number
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          abbreviation?: string | null
          created_at?: string
          id?: number
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string | null
          created_at?: string
          id?: number
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      esports_categories: {
        Row: {
          created_at: string
          division: string
          esport_id: number
          id: number
          levels: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          division: string
          esport_id: number
          id?: number
          levels: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          division?: string
          esport_id?: number
          id?: number
          levels?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esports_categories_esport_id_fkey"
            columns: ["esport_id"]
            isOneToOne: false
            referencedRelation: "esports"
            referencedColumns: ["id"]
          },
        ]
      }
      esports_seasons_stages: {
        Row: {
          competition_stage: string
          created_at: string
          esport_category_id: number | null
          id: number
          season_id: number | null
          updated_at: string
        }
        Insert: {
          competition_stage: string
          created_at?: string
          esport_category_id?: number | null
          id?: number
          season_id?: number | null
          updated_at?: string
        }
        Update: {
          competition_stage?: string
          created_at?: string
          esport_category_id?: number | null
          id?: number
          season_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "esports_seasons_stages_esport_category_id_fkey"
            columns: ["esport_category_id"]
            isOneToOne: false
            referencedRelation: "esports_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esports_seasons_stages_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          answer: string
          category: string
          created_at: string
          display_order: number
          id: number
          is_active: boolean
          is_highlight: boolean
          is_open: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          display_order?: number
          id?: number
          is_active?: boolean
          is_highlight?: boolean
          is_open?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          display_order?: number
          id?: number
          is_active?: boolean
          is_highlight?: boolean
          is_open?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_characters: {
        Row: {
          created_at: string | null
          esport_id: number | null
          icon_url: string | null
          id: number
          name: string
          role: string
        }
        Insert: {
          created_at?: string | null
          esport_id?: number | null
          icon_url?: string | null
          id?: number
          name: string
          role: string
        }
        Update: {
          created_at?: string | null
          esport_id?: number | null
          icon_url?: string | null
          id?: number
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_characters_esport_id_fkey"
            columns: ["esport_id"]
            isOneToOne: false
            referencedRelation: "esports"
            referencedColumns: ["id"]
          },
        ]
      }
      game_hero_bans: {
        Row: {
          ban_order: number | null
          created_at: string
          game_id: number
          hero_name: string
          id: string
          team_id: string
        }
        Insert: {
          ban_order?: number | null
          created_at?: string
          game_id: number
          hero_name: string
          id?: string
          team_id: string
        }
        Update: {
          ban_order?: number | null
          created_at?: string
          game_id?: number
          hero_name?: string
          id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_hero_bans_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_hero_bans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "schools_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          created_at: string
          game_id: number | null
          id: number
          match_participant_id: number
          score: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          game_id?: number | null
          id?: number
          match_participant_id: number
          score: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          game_id?: number | null
          id?: number
          match_participant_id?: number
          score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_scores_match_participant_id_fkey"
            columns: ["match_participant_id"]
            isOneToOne: false
            referencedRelation: "match_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string
          duration: string
          end_at: string | null
          game_number: number
          id: number
          match_id: number
          start_at: string | null
          updated_at: string
          valorant_map_id: number | null
        }
        Insert: {
          created_at?: string
          duration?: string
          end_at?: string | null
          game_number?: number
          id?: number
          match_id: number
          start_at?: string | null
          updated_at?: string
          valorant_map_id?: number | null
        }
        Update: {
          created_at?: string
          duration?: string
          end_at?: string | null
          game_number?: number
          id?: number
          match_id?: number
          start_at?: string | null
          updated_at?: string
          valorant_map_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_valorant_map_id_fkey"
            columns: ["valorant_map_id"]
            isOneToOne: false
            referencedRelation: "valorant_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      hero_section_live: {
        Row: {
          created_at: string
          end_at: string
          id: number
          video_link: string
        }
        Insert: {
          created_at?: string
          end_at: string
          id?: number
          video_link: string
        }
        Update: {
          created_at?: string
          end_at?: string
          id?: number
          video_link?: string
        }
        Relationships: []
      }
      match_participants: {
        Row: {
          created_at: string
          id: number
          match_id: number
          match_score: number | null
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          match_id: number
          match_score?: number | null
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          match_id?: number
          match_score?: number | null
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "schools_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          best_of: number
          created_at: string
          description: string
          end_at: string | null
          id: number
          name: string
          scheduled_at: string | null
          stage_id: number
          start_at: string | null
          status: Database["public"]["Enums"]["match_status"]
          stream_url: string | null
          updated_at: string
          venue: string
        }
        Insert: {
          best_of?: number
          created_at?: string
          description: string
          end_at?: string | null
          id?: number
          name: string
          scheduled_at?: string | null
          stage_id: number
          start_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          stream_url?: string | null
          updated_at?: string
          venue: string
        }
        Update: {
          best_of?: number
          created_at?: string
          description?: string
          end_at?: string | null
          id?: number
          name?: string
          scheduled_at?: string | null
          stage_id?: number
          start_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          stream_url?: string | null
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "esports_seasons_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      mlbb_items: {
        Row: {
          created_at: string
          id: number
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          name?: string | null
        }
        Relationships: []
      }
      photo_gallery: {
        Row: {
          caption: string
          category: string
          created_at: string
          id: number
          photo_by: string
          photo_url: string
          title: string
          updated_at: string | null
        }
        Insert: {
          caption: string
          category: string
          created_at?: string
          id?: number
          photo_by: string
          photo_url: string
          title: string
          updated_at?: string | null
        }
        Update: {
          caption?: string
          category?: string
          created_at?: string
          id?: number
          photo_by?: string
          photo_url?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      player_seasons: {
        Row: {
          created_at: string
          id: number
          is_active: boolean | null
          player_id: string
          season_id: number
          team_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          player_id: string
          season_id: number
          team_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean | null
          player_id?: string
          season_id?: number
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_seasons_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_seasons_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_seasons_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "schools_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          ign: string
          is_active: boolean | null
          last_name: string | null
          photo_url: string | null
          role: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          ign: string
          is_active?: boolean | null
          last_name?: string | null
          photo_url?: string | null
          role?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          ign?: string
          is_active?: boolean | null
          last_name?: string | null
          photo_url?: string | null
          role?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "schools_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          abbreviation?: string
          created_at?: string
          id?: string
          is_active: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      schools_teams: {
        Row: {
          created_at: string
          esport_category_id: number
          id: string
          is_active: boolean
          name: string
          school_id: string
          season_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          esport_category_id: number
          id?: string
          is_active?: boolean
          name?: string
          school_id: string
          season_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          esport_category_id?: number
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          season_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_teams_esport_category_id_fkey"
            columns: ["esport_category_id"]
            isOneToOne: false
            referencedRelation: "esports_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_teams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_teams_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_at: string
          id: number
          start_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_at: string
          id?: number
          start_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_at?: string
          id?: number
          start_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          tagline: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active: boolean
          logo_url?: string | null
          tagline: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          tagline?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stats_mlbb_game_player: {
        Row: {
          assists: number | null
          created_at: string
          damage_dealt: number | null
          damage_taken: number | null
          deaths: number | null
          game_id: number
          gold: number | null
          hero_name: string | null
          id: string
          is_mvp: boolean | null
          kills: number | null
          lord_slain: number | null
          player_id: string
          rating: number | null
          team_id: string | null
          teamfight: number | null
          turret_damage: number | null
          turtle_slain: number | null
        }
        Insert: {
          assists?: number | null
          created_at?: string
          damage_dealt?: number | null
          damage_taken?: number | null
          deaths?: number | null
          game_id: number
          gold?: number | null
          hero_name?: string | null
          id?: string
          is_mvp?: boolean | null
          kills?: number | null
          lord_slain?: number | null
          player_id: string
          rating?: number | null
          team_id?: string | null
          teamfight?: number | null
          turret_damage?: number | null
          turtle_slain?: number | null
        }
        Update: {
          assists?: number | null
          created_at?: string
          damage_dealt?: number | null
          damage_taken?: number | null
          deaths?: number | null
          game_id?: number
          gold?: number | null
          hero_name?: string | null
          id?: string
          is_mvp?: boolean | null
          kills?: number | null
          lord_slain?: number | null
          player_id?: string
          rating?: number | null
          team_id?: string | null
          teamfight?: number | null
          turret_damage?: number | null
          turtle_slain?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stats_mlbb_game_player_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stats_mlbb_game_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stats_mlbb_game_player_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "schools_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      stats_valorant_game_player: {
        Row: {
          acs: number | null
          agent_name: string | null
          assists: number | null
          created_at: string
          deaths: number | null
          defuses: number | null
          econ_rating: number | null
          first_bloods: number | null
          game_id: number
          id: string
          is_mvp: boolean | null
          kills: number | null
          plants: number | null
          player_id: string
          team_id: string | null
        }
        Insert: {
          acs?: number | null
          agent_name?: string | null
          assists?: number | null
          created_at?: string
          deaths?: number | null
          defuses?: number | null
          econ_rating?: number | null
          first_bloods?: number | null
          game_id: number
          id?: string
          is_mvp?: boolean | null
          kills?: number | null
          plants?: number | null
          player_id: string
          team_id?: string | null
        }
        Update: {
          acs?: number | null
          agent_name?: string | null
          assists?: number | null
          created_at?: string
          deaths?: number | null
          defuses?: number | null
          econ_rating?: number | null
          first_bloods?: number | null
          game_id?: number
          id?: string
          is_mvp?: boolean | null
          kills?: number | null
          plants?: number | null
          player_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stats_valorant_game_player_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stats_valorant_game_player_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stats_valorant_game_player_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "schools_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      valorant_map_vetoes: {
        Row: {
          action: Database["public"]["Enums"]["veto_action"]
          created_at: string
          id: string
          map_name: string
          match_id: number
          sequence_order: number
          side_selected: Database["public"]["Enums"]["game_side"] | null
          team_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["veto_action"]
          created_at?: string
          id?: string
          map_name: string
          match_id: number
          sequence_order: number
          side_selected?: Database["public"]["Enums"]["game_side"] | null
          team_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["veto_action"]
          created_at?: string
          id?: string
          map_name?: string
          match_id?: number
          sequence_order?: number
          side_selected?: Database["public"]["Enums"]["game_side"] | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valorant_map_vetoes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valorant_map_vetoes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "schools_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      valorant_maps: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean
          name: string
          splash_image_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean
          name: string
          splash_image_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean
          name?: string
          splash_image_url?: string | null
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          created_at: string
          department_id: number | null
          full_name: string
          id: string
          image_url: string | null
          is_active: boolean | null
          season_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: number | null
          full_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          season_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: number | null
          full_name?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          season_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteers_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_stage_id: {
        Args: { old_league_schedule_id: string; old_platform_id: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_head_writer: { Args: never; Returns: boolean }
      is_league_operator: { Args: never; Returns: boolean }
      is_writer: { Args: never; Returns: boolean }
    }
    Enums: {
      article_status: "review" | "published" | "draft" | "archived" | "featured"
      game_side: "attack" | "defense"
      game_type: "mlbb" | "valorant"
      match_format: "bo1" | "bo2" | "bo3" | "bo5" | "bo7"
      match_status:
        | "upcoming"
        | "live"
        | "finished"
        | "completed"
        | "rescheduled"
        | "canceled"
      round_type: "group" | "playoffs" | "finals"
      user_role: "admin" | "league_operator" | "head_writer" | "writer"
      veto_action: "pick" | "ban" | "remain"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      article_status: ["review", "published", "draft", "archived", "featured"],
      game_side: ["attack", "defense"],
      game_type: ["mlbb", "valorant"],
      match_format: ["bo1", "bo2", "bo3", "bo5", "bo7"],
      match_status: [
        "upcoming",
        "live",
        "finished",
        "completed",
        "rescheduled",
        "canceled",
      ],
      round_type: ["group", "playoffs", "finals"],
      user_role: ["admin", "league_operator", "head_writer", "writer"],
      veto_action: ["pick", "ban", "remain"],
    },
  },
} as const
