'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfiniteSchedule } from '@/components/schedule';
import { ScheduleMatch } from '@/lib/types/matches';
import { useInfiniteSchedule } from '@/hooks/use-schedule';
import { Season } from '@/lib/types/seasons';
import { EsportsSeasonStageWithDetails } from '@/lib/types/esports-seasons-stages';


// Define the rich category type
export interface RichSportCategory {
  id: number;
  division: string;
  levels: string;
  full_name: string;
  formatted_name?: string; // Optional for backward compatibility if needed
  esport: {
    id: number;
    name: string;
    logo_url: string | null;
    abbreviation: string | null;
  } | null;
}

interface ScheduleContentProps {
  initialMatches: ScheduleMatch[];
  initialHasMorePast?: boolean;
  initialHasMoreFuture?: boolean;
  initialPastCursor?: string | null;
  initialFutureCursor?: string | null;
  availableCategories: RichSportCategory[];
  availableSeasons: Season[];
  availableStages: EsportsSeasonStageWithDetails[];
}

export default function ScheduleContent({ 
  initialMatches, 
  initialHasMorePast = true,
  initialHasMoreFuture = false,
  initialPastCursor = null,
  initialFutureCursor = null,
  availableCategories,
  availableSeasons,
  availableStages
}: ScheduleContentProps) {
  const [selectedEsport, setSelectedEsport] = useState<string>('all');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedSeason, setSelectedSeason] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');

  // Derive IDs for API
  const esportIdFilter = useMemo(() => {
    return selectedEsport === 'all' ? undefined : parseInt(selectedEsport);
  }, [selectedEsport]);

  const divisionFilter = useMemo(() => {
    return selectedDivision === 'all' ? undefined : selectedDivision;
  }, [selectedDivision]);

  const seasonIdFilter = useMemo(() => {
    return selectedSeason === 'all' ? undefined : parseInt(selectedSeason);
  }, [selectedSeason]);

  const stageNameFilter = useMemo(() => {
    return selectedStage === 'all' ? undefined : selectedStage;
  }, [selectedStage]);

  // Use the infinite schedule hook for client-side data fetching
  const {
    data,
    hasNextPage,
    hasPreviousPage,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    error: _error
  } = useInfiniteSchedule({
    limit: 5,
    direction: 'future',
    filters: {
      sport_id: esportIdFilter,
      division: divisionFilter,
      season_id: seasonIdFilter,
      stage_name: stageNameFilter
    }
  });

  const matches = data?.matches || [];

  const handleLoadMore = useCallback((direction: 'future' | 'past') => {
    if (direction === 'future' && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    } else if (direction === 'past' && hasPreviousPage && !isFetchingPreviousPage) {
      fetchPreviousPage();
    }
  }, [hasNextPage, hasPreviousPage, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, fetchPreviousPage]);

  const handleEsportChange = useCallback((esportId: string) => {
    setSelectedEsport(esportId);
    // Optional: Reset division if needed, or keep it if valid
    // For now, let's keep it simple.
  }, []);

  const handleDivisionChange = useCallback((division: string) => {
    setSelectedDivision(division);
  }, []);

  // Check if any filters are applied
  const isFiltersApplied = selectedEsport !== 'all' || selectedDivision !== 'all' || selectedSeason !== 'all' || selectedStage !== 'all';

  // Use server-side initial data if client-side data is not ready yet
  // BUT: Don't fall back to initialMatches if filters are applied (they would be unfiltered)
  const displayMatches = useMemo(() => {
    // If we have client-side data from the query, use it
    if (matches.length > 0) {
      return matches;
    }
    
    // If filters are applied but no query data yet, show empty while loading
    if (isFiltersApplied) {
      // Apply client-side filtering to initial matches as a fallback
      return initialMatches.filter((match) => {
        // Season filter
        if (selectedSeason !== 'all') {
          const matchSeasonId = match.esports_seasons_stages?.season_id;
          if (!matchSeasonId || matchSeasonId.toString() !== selectedSeason) {
            return false;
          }
        }
        
        // Esport filter
        if (selectedEsport !== 'all') {
          const matchEsportId = match.esports_seasons_stages?.esports_categories?.esports?.id;
          if (!matchEsportId || matchEsportId.toString() !== selectedEsport) {
            return false;
          }
        }
        
        // Division filter
        if (selectedDivision !== 'all') {
          const matchDivision = match.esports_seasons_stages?.esports_categories?.division;
          if (!matchDivision || matchDivision !== selectedDivision) {
            return false;
          }
        }
        
        // Stage filter
        if (selectedStage !== 'all') {
          const matchStageName = match.esports_seasons_stages?.competition_stage;
          if (!matchStageName || matchStageName !== selectedStage) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // No filters applied, use initial matches
    return initialMatches;
  }, [matches, initialMatches, isFiltersApplied, selectedSeason, selectedEsport, selectedDivision, selectedStage]);

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <InfiniteSchedule
          matches={displayMatches}
          onLoadMore={handleLoadMore}
          hasMoreFuture={data ? hasNextPage : initialHasMoreFuture}
          hasMorePast={data ? hasPreviousPage : initialHasMorePast}
          isLoading={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          isFetchingPreviousPage={isFetchingPreviousPage}
          selectedEsportId={selectedEsport}
          onEsportChange={handleEsportChange}
          selectedDivision={selectedDivision}
          onDivisionChange={handleDivisionChange}
          availableRichSports={availableCategories}
          availableSeasons={availableSeasons}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeason}
          availableStages={availableStages}
          selectedStage={selectedStage}
          onStageChange={setSelectedStage}
        />
      </div>
    </div>
  );
}
