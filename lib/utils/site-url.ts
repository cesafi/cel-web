/**
 * Utility functions for handling site URLs
 */

/**
 * Get the base site URL from environment variable or fallback to current origin
 */
export function getSiteUrl(): string {
  // Use environment variable if available
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  // Fallback to current origin in browser
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for server-side rendering
  return 'https://cesafi.org';
}

/**
 * Get the full URL for a given path
 */
export function getFullUrl(path: string): string {
  const baseUrl = getSiteUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get the full URL for an article by slug
 */
export function getArticleUrl(slug: string): string {
  return getFullUrl(`/news/${slug}`);
}

/**
 * Validate if a URL is safe for sharing
 */
export function isValidShareUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }
    
    // Prevent sharing of localhost URLs in production
    if (process.env.NODE_ENV === 'production' && 
        (parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}
