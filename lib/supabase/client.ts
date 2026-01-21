import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/database.types';
import { TypedSupabaseClient } from '../types/base';

export const getSupabaseClient = (): TypedSupabaseClient => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  );
};
