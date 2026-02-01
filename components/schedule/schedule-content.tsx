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
  availableCategories: RichSportCategory[];
  availableSeasons: Season[];
  availableStages: EsportsSeasonStageWithDetails[];
}

export default function ScheduleContent({ 
  initialMatches, 
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

  const stageIdFilter = useMemo(() => {
    return selectedStage === 'all' ? undefined : parseInt(selectedStage);
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
    limit: 20,
    direction: 'future',
    filters: {
      sport_id: esportIdFilter,
      division: divisionFilter,
      season_id: seasonIdFilter,
      stage_id: stageIdFilter
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

  // Use server-side initial data if client-side data is not ready yet
  const displayMatches = matches.length > 0 ? matches : initialMatches;

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <InfiniteSchedule
          matches={displayMatches}
          onLoadMore={handleLoadMore}
          hasMoreFuture={hasNextPage}
          hasMorePast={hasPreviousPage}
          isLoading={isFetching || isFetchingNextPage || isFetchingPreviousPage}
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
