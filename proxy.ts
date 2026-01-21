import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/session';

export async function proxy(request: NextRequest) {
  try {
    const response = await updateSession(request);

    return response;
  } catch (_) {
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - videos - .mp4, .webm, .ogg
     * - public static assets folder
     */
    '/((?!_next/static|_next/image|favicon.ico|videos/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|webm|ogg)$).*)'
  ]
};
