/**
 * Convert team metadata into a URL-safe slug
 * Format: [season]-[esport]-[category]-[team-name]
 * Example: "preseason-3-valorant-mens-vamos-warriors"
 */
export function toTeamSlug(parts: {
  seasonName?: string;
  esportName?: string;
  division?: string;
  teamName: string;
}): string {
  const segments = [
    parts.seasonName,
    parts.esportName,
    parts.division,
    parts.teamName,
  ]
    .filter(Boolean)
    .join(' ');

  return segments
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '');        // trim leading/trailing hyphens
}

/**
 * Check if a team's generated slug matches a given URL slug
 */
export function teamMatchesSlug(
  parts: {
    seasonName?: string;
    esportName?: string;
    division?: string;
    teamName: string;
  },
  slug: string
): boolean {
  return toTeamSlug(parts) === slug.toLowerCase();
}
