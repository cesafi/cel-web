import { Database } from '@/database.types';

export type Esport = Database['public']['Tables']['esports']['Row'];
export type EsportCategory = Database['public']['Tables']['esports_categories']['Row'];

export interface EsportCategoryWithEsport extends EsportCategory {
  esports: Esport;
}
