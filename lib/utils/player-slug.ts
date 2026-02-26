/**
 * Convert a player IGN to a URL-safe kebab-case slug
 * "SYV GOD" → "syv-god"
 * "xDragon" → "xdragon"
 * "K1NG 123" → "k1ng-123"
 */
export function toPlayerSlug(ign: string): string {
  return ign
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars except spaces and hyphens
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '');        // trim leading/trailing hyphens
}

/**
 * Check if a stored IGN matches a URL slug
 */
export function ignMatchesSlug(ign: string, slug: string): boolean {
  return toPlayerSlug(ign) === slug.toLowerCase();
}
