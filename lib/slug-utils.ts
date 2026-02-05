
export function toSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars (except spaces and dashes)
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with dashes
    .replace(/^-+|-+$/g, ''); // Trim dashes
}

export function fromSlug(slug: string): string {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Generic interface for items named items
interface NamedItem {
  id: number | string;
  name?: string | null;
  // For stages
  competition_stage?: string; 
  // For categories
  display_name?: string;
  // For sports
  abbreviation?: string | null;
}

export function findItemBySlug<T extends NamedItem>(items: T[], slug: string): T | undefined {
  if (!items || !slug) return undefined;
  
  const targetSlug = slug.toLowerCase();
  
  return items.find(item => {
    // Check name
    if (item.name && toSlug(item.name) === targetSlug) return true;
    
    // Check display_name (categories)
    if (item.display_name && toSlug(item.display_name) === targetSlug) return true;
    
    // Check competition_stage (stages)
    if (item.competition_stage && toSlug(item.competition_stage) === targetSlug) return true;
    
    // Check abbreviation (Esports like MLBB)
    if (item.abbreviation && toSlug(item.abbreviation) === targetSlug) return true;
    
    return false;
  });
}

// Specific helper for stages which have inconsistent naming in DB
export function normalizeStageSlug(slug: string): string {
  if (!slug) return '';
  const s = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s === 'groupstage' || s === 'group-stage') return 'group-stage';
  if (s === 'playins' || s === 'play-ins') return 'play-ins';
  if (s === 'playoffs') return 'playoffs';
  if (s === 'finals') return 'finals';
  return slug;
}
