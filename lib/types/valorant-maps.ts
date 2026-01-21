import { Database } from '@/database.types';

export type ValorantMap = Database['public']['Tables']['valorant_maps']['Row'];
export type ValorantMapInsert = Database['public']['Tables']['valorant_maps']['Insert'];
export type ValorantMapUpdate = Database['public']['Tables']['valorant_maps']['Update'];
