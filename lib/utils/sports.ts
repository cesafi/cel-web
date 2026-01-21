// Sports utilities for the codebase
// This file provides sports-related utility functions

import { EsportCategoryWithEsport } from '@/lib/types/esports';

// Re-export from esports for backwards compatibility
export { formatCategoryName } from './esports';

// Sport category type for traditional sports
export interface SportCategoryWithSport {
  id: number;
  division: string;
  levels: string;
  sports: {
    id: number;
    name: string;
  };
}

// Get sport icon based on sport name
export function getSportIcon(sportName: string): string {
  const icons: Record<string, string> = {
    'basketball': '🏀',
    'volleyball': '🏐',
    'football': '⚽',
    'soccer': '⚽',
    'badminton': '🏸',
    'table tennis': '🏓',
    'tennis': '🎾',
    'swimming': '🏊',
    'athletics': '🏃',
    'baseball': '⚾',
    'chess': '♟️',
    'mlbb': '🎮',
    'mobile legends': '🎮',
    'valorant': '🎯',
    'dota 2': '🎮',
    'league of legends': '🎮'
  };
  
  const normalizedName = sportName.toLowerCase();
  return icons[normalizedName] || '🏆';
}

// Format sport category display name
export function formatSportCategoryName(category: SportCategoryWithSport): string {
  const divisionLabel = category.division === 'men' ? "Men's" : 
                        category.division === 'women' ? "Women's" : 
                        category.division;
  const levelLabel = category.levels.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `${divisionLabel} ${levelLabel}`;
}
