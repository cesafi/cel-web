import { Database } from '@/database.types';

export type ValorantMapVeto = Database['public']['Tables']['valorant_map_vetoes']['Row'];
export type ValorantMapVetoInsert = Database['public']['Tables']['valorant_map_vetoes']['Insert'];
export type ValorantMapVetoUpdate = Database['public']['Tables']['valorant_map_vetoes']['Update'];

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
