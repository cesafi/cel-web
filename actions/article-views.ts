'use server';

import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabase/server';

const VIEWER_COOKIE_NAME = 'cel_viewer_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

/**
 * Server Action to track an article view.
 * Generates or reads an anonymous viewer_id cookie, then calls
 * the track_article_view RPC to safely record the view.
 *
 * The RPC is defined as SECURITY DEFINER in Postgres, so it runs
 * with the function owner's privileges — no admin client needed.
 */
export async function trackArticleView(articleId: string): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    let viewerId = cookieStore.get(VIEWER_COOKIE_NAME)?.value;

    // Generate a new anonymous viewer ID if one doesn't exist
    if (!viewerId) {
      viewerId = crypto.randomUUID();
      cookieStore.set(VIEWER_COOKIE_NAME, viewerId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      });
    }

    // Call the Supabase RPC (SECURITY DEFINER handles privileges)
    const supabase = await getSupabaseServer();
    const { error } = await supabase.rpc('track_article_view', {
      p_article_id: articleId,
      p_viewer_id: viewerId,
    });

    if (error) {
      console.error('[Article Views] Failed to track view:', error.message);
      return { success: false };
    }

    return { success: true };
  } catch (err) {
    console.error('[Article Views] Unexpected error:', err);
    return { success: false };
  }
}
