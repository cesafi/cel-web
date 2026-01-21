'use client';

import { useSeason } from '@/components/contexts/season-provider';

// Re-export the hook for easier imports
export { useSeason };

// You can also add additional season-specific utilities here
export function useSeasonContext() {
  const seasonContext = useSeason();
  
  const isCurrentSeasonActive = () => {
    if (!seasonContext.currentSeason) return false;
    
    const now = new Date();
    const startDate = new Date(seasonContext.currentSeason.start_at);
    const endDate = new Date(seasonContext.currentSeason.end_at);
    
    return now >= startDate && now <= endDate;
  };

  const getSeasonDuration = () => {
    if (!seasonContext.currentSeason) return 0;
    
    const startDate = new Date(seasonContext.currentSeason.start_at);
    const endDate = new Date(seasonContext.currentSeason.end_at);
    
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  return {
    ...seasonContext,
    isCurrentSeasonActive,
    getSeasonDuration
  };
}
