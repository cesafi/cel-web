import { EsportCategoryWithEsport } from '@/lib/types/esports';

// Overload for full category object
export function formatCategoryName(category: EsportCategoryWithEsport): string;
// Overload for division and levels strings
export function formatCategoryName(division: string, levels: string): string;
// Implementation
export function formatCategoryName(
  categoryOrDivision: EsportCategoryWithEsport | string,
  levels?: string
): string {
  if (typeof categoryOrDivision === 'string') {
    // Called with division and levels strings
    return `${categoryOrDivision} - ${levels}`;
  }
  // Called with full category object
  return `${categoryOrDivision.esports.name} - ${categoryOrDivision.division} (${categoryOrDivision.levels})`;
}
