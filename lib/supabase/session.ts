import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { Database } from '@/database.types';
import { type NextRequest, NextResponse } from 'next/server';
import { isProtectedRoute, isKnownRoute, getRedirectUrl, hasAccessToRoute } from '@/lib/routes';

type UserRole = Database['public']['Enums']['user_role'];

export const updateSession = async (request: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  try {
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));

            response = NextResponse.next({ request });

            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, { ...cookieOptions, ...options })
            );
          }
        }
      }
    );

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    const url = request.nextUrl.pathname;
    const role = user?.app_metadata?.role as UserRole | undefined;

    // Check if the route is known (exists in our application)
    if (!isKnownRoute(url)) {
      return NextResponse.redirect(new URL('/not-found', request.url));
    }

    // Handle protected routes
    if (isProtectedRoute(url)) {
      if (userError || !user) {
        return NextResponse.redirect(new URL('/no-access', request.url));
      }
      
      // Check if user has the right role for this protected route
      if (role && !hasAccessToRoute(url, role)) {
        return NextResponse.redirect(new URL('/no-access', request.url));
      }
    }

    // Handle authenticated user redirects
    if (user) {
      const redirectUrl = getRedirectUrl(url, role);
      
      // If we need to redirect (different from current URL)
      if (redirectUrl !== url) {
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
    }

    return response;
  } catch (_) {
    return response;
  }
};
