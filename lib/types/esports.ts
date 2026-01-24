import { Database } from '@/database.types';

export type Esport = Database['public']['Tables']['esports']['Row'];
export type EsportInsert = Database['public']['Tables']['esports']['Insert'];
export type EsportUpdate = Database['public']['Tables']['esports']['Update'];
export type EsportCategory = Database['public']['Tables']['esports_categories']['Row'];

export interface EsportCategoryWithEsport extends EsportCategory {
  esports: Esport;
  [key: string]: unknown;
}

