import { Database } from '@/database.types';

export type GameCharacter = Database['public']['Tables']['game_characters']['Row'];
export type GameCharacterInsert = Database['public']['Tables']['game_characters']['Insert'];
export type GameCharacterUpdate = Database['public']['Tables']['game_characters']['Update'];

export interface GameCharacterWithEsport extends GameCharacter {
  esports: {
    id: number;
    name: string;
  } | null;
}
