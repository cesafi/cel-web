/**
 * Route configuration for CESAFI Sports Website
 * Defines public and protected routes for middleware handling
 */

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  // Root and static pages
  '/',
  '/favicon.ico',
  '/sitemap.xml',
  '/robots.txt',

  // Legal pages
  '/privacy-policy',
  '/terms-of-service',

  // Authentication
  '/login',

  // Public content pages
  '/about-us',
  '/articles',
  '/contact',
  '/faq',
  '/news',
  '/news/[slug]', // Dynamic route pattern
  '/schedule',
  '/standings',
  '/schools',
  '/schools/[slug]', // Dynamic route pattern
  '/volunteers',
  '/partners',

  // Error pages
  '/not-found',
  '/no-access'
] as const;

// Protected routes that require authentication
export const PROTECTED_ROUTES = [
  // Admin routes
  '/admin',
  '/admin/accounts',
  '/admin/articles',
  '/admin/articles/[id]',
  '/admin/articles/new',
  '/admin/departments',
  '/admin/faq',
  '/admin/hero-section',
  '/admin/league-stage',
  '/admin/matches',
  '/admin/matches/[id]',
  '/admin/photo-gallery',
  '/admin/school-teams',
  '/admin/schools',
  '/admin/seasons',
  '/admin/sponsors',
  '/admin/sports',
  '/admin/timeline',
  '/admin/volunteers',

  // Head Writer routes
  '/head-writer',
  '/head-writer/articles',
  '/head-writer/articles/[id]',
  '/head-writer/articles/new',
  '/head-writer/faq',
  '/head-writer/timeline',

  // League Operator routes
  '/league-operator',
  '/league-operator/matches',
  '/league-operator/matches/[id]',

  // Writer routes
  '/writer',
  '/writer/articles',
  '/writer/articles/[id]',
  '/writer/articles/new',

  // Preview routes
  '/preview',
  '/preview/articles',
  '/preview/articles/[id]'
] as const;

// Route patterns for dynamic matching
export const ROUTE_PATTERNS = {
  // Public dynamic routes
  public: [
    /^\/$/,
    /^\/favicon\.ico$/,
    /^\/sitemap\.xml$/,
    /^\/robots\.txt$/,
    /^\/privacy-policy$/,
    /^\/terms-of-service$/,
    /^\/login$/,
    /^\/about-us$/,
    /^\/articles$/,
    /^\/contact$/,
    /^\/faq$/,
    /^\/news$/,
    /^\/news\/[^\/]+$/, // /news/[slug]
    /^\/schedule$/,
    /^\/standings$/,
    /^\/schools$/,
    /^\/schools\/[^\/]+$/, // /schools/[slug]
    /^\/volunteers$/,
    /^\/partners$/,
    /^\/not-found$/,
    /^\/no-access$/
  ],

  // Protected dynamic routes
  protected: [
    // Admin routes
    /^\/admin$/,
    /^\/admin\/accounts$/,
    /^\/admin\/articles$/,
    /^\/admin\/articles\/[^\/]+$/, // /admin/articles/[id]
    /^\/admin\/articles\/new$/,
    /^\/admin\/departments$/,
    /^\/admin\/faq$/,
    /^\/admin\/hero-section$/,
    /^\/admin\/league-stage$/,
    /^\/admin\/matches$/,
    /^\/admin\/matches\/[^\/]+$/, // /admin/matches/[id]
    /^\/admin\/photo-gallery$/,
    /^\/admin\/school-teams$/,
    /^\/admin\/schools$/,
    /^\/admin\/seasons$/,
    /^\/admin\/sponsors$/,
    /^\/admin\/sports$/,
    /^\/admin\/timeline$/,
    /^\/admin\/volunteers$/,

    // Head Writer routes
    /^\/head-writer$/,
    /^\/head-writer\/articles$/,
    /^\/head-writer\/articles\/[^\/]+$/, // /head-writer/articles/[id]
    /^\/head-writer\/articles\/new$/,
    /^\/head-writer\/faq$/,
    /^\/head-writer\/timeline$/,

    // League Operator routes
    /^\/league-operator$/,
    /^\/league-operator\/matches$/,
    /^\/league-operator\/matches\/[^\/]+$/, // /league-operator/matches/[id]

    // Writer routes
    /^\/writer$/,
    /^\/writer\/articles$/,
    /^\/writer\/articles\/[^\/]+$/, // /writer/articles/[id]
    /^\/writer\/articles\/new$/,

    // Preview routes
    /^\/preview$/,
    /^\/preview\/articles$/,
    /^\/preview\/articles\/[^\/]+$/ // /preview/articles/[id]
  ]
} as const;

// User role dashboards
export const ROLE_DASHBOARDS = {
  admin: '/admin',
  head_writer: '/head-writer',
  league_operator: '/league-operator',
  writer: '/writer'
} as const;

// Role-based route access
export const ROLE_ROUTES = {
  admin: [/^\/admin/, /^\/preview/],
  head_writer: [/^\/head-writer/, /^\/preview/],
  league_operator: [/^\/league-operator/],
  writer: [/^\/writer/]
} as const;

// Helper functions
export function isPublicRoute(pathname: string): boolean {
  return ROUTE_PATTERNS.public.some((pattern) => pattern.test(pathname));
}

export function isProtectedRoute(pathname: string): boolean {
  return ROUTE_PATTERNS.protected.some((pattern) => pattern.test(pathname));
}

export function isKnownRoute(pathname: string): boolean {
  return isPublicRoute(pathname) || isProtectedRoute(pathname);
}

export function hasAccessToRoute(pathname: string, userRole: string): boolean {
  const roleRoutes = ROLE_ROUTES[userRole as keyof typeof ROLE_ROUTES];
  if (!roleRoutes) return false;

  return roleRoutes.some((pattern) => pattern.test(pathname));
}

export function getRedirectUrl(pathname: string, userRole?: string): string {
  // If user is at login page, redirect to their dashboard
  if (pathname === '/login') {
    if (userRole && userRole in ROLE_DASHBOARDS) {
      return ROLE_DASHBOARDS[userRole as keyof typeof ROLE_DASHBOARDS];
    }
    return '/';
  }

  // Allow authenticated users to access the landing page (root path)
  // Only redirect to dashboard if they're coming from login
  if (pathname === '/') {
    return '/'; // Allow access to landing page
  }

  // If accessing unknown route, redirect to 404
  if (!isKnownRoute(pathname)) {
    return '/not-found';
  }

  // Default: allow the request (protected routes are handled in middleware)
  return pathname;
}
