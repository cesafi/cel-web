import { Database } from '@/database.types';

export type MlbbItem = Database['public']['Tables']['mlbb_items']['Row'];
export type MlbbItemInsert = Database['public']['Tables']['mlbb_items']['Insert'];
export type MlbbItemUpdate = Database['public']['Tables']['mlbb_items']['Update'];
