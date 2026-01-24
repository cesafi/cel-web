import { Database } from '@/database.types';
import { EsportCategoryWithEsport } from './esports';

export type EsportsSeasonStage = Database['public']['Tables']['esports_seasons_stages']['Row'];

export interface EsportsSeasonStageWithDetails extends EsportsSeasonStage {
  esports_categories: EsportCategoryWithEsport | null;
  [key: string]: unknown;
}

