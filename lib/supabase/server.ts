'use server';

import { createServerClient } from '@supabase/ssr';
import { Database } from '@/database.types';
import { cookies } from 'next/headers';

import { TypedSupabaseClient } from '../types/base';

export async function getSupabaseServer(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      auth: {
        persistSession: true
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      },
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 7
      }
    }
  );
}
