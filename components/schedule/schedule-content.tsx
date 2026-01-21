'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InfiniteSchedule } from '@/components/schedule';
import { ScheduleMatch } from '@/lib/types/matches';
import { useInfiniteSchedule } from '@/hooks/use-schedule';

interface ScheduleContentProps {
  initialMatches: ScheduleMatch[];
  availableCategories: Array<{
    id: number;
    division: string;
    levels: string;
    sport_name: string;
    formatted_name: string;
  }>;
}

export default function ScheduleContent({ initialMatches, availableCategories }: ScheduleContentProps) {
  const [selectedMatch, setSelectedMatch] = useState<ScheduleMatch | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('all');

  // Memoize the sport filter to prevent unnecessary re-renders
  const sportFilter = useMemo(() => {
    return selectedSport === 'all' ? undefined : 
      availableCategories.find(cat => cat.formatted_name === selectedSport)?.id;
  }, [selectedSport, availableCategories]);

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
      sport_id: sportFilter
    }
  });

  const matches = data?.matches || [];

  // Memoize handlers to prevent unnecessary re-renders
  const handleMatchClick = useCallback((match: ScheduleMatch) => {
    setSelectedMatch(match);
  }, []);

  const handleLoadMore = useCallback((direction: 'future' | 'past') => {
    if (direction === 'future' && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    } else if (direction === 'past' && hasPreviousPage && !isFetchingPreviousPage) {
      fetchPreviousPage();
    }
  }, [hasNextPage, hasPreviousPage, isFetchingNextPage, isFetchingPreviousPage, fetchNextPage, fetchPreviousPage]);

  const handleSportChange = useCallback((sport: string) => {
    setSelectedSport(sport);
  }, []);

  // Memoize sport options to prevent unnecessary re-renders
  const sportOptions = useMemo(() => 
    availableCategories.map(category => ({
      value: category.formatted_name,
      label: category.formatted_name
    })), [availableCategories]
  );

  // Memoize available sports array
  const availableSports = useMemo(() => 
    sportOptions.map(option => option.value), [sportOptions]
  );

  // Use server-side initial data if client-side data is not ready yet
  const displayMatches = matches.length > 0 ? matches : initialMatches;

  return (
    <div className="flex h-full w-full min-w-0 flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <InfiniteSchedule
          matches={displayMatches}
          onMatchClick={handleMatchClick}
          onLoadMore={handleLoadMore}
          hasMoreFuture={hasNextPage}
          hasMorePast={hasPreviousPage}
          isLoading={isFetching || isFetchingNextPage || isFetchingPreviousPage}
          selectedSport={selectedSport}
          onSportChange={handleSportChange}
          availableSports={availableSports}
        />
      </div>

      {/* Match Details Modal Placeholder */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="mx-4 w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="font-mango-grotesque">{selectedMatch.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-roboto">Match details would be displayed here...</p>
              <Button onClick={() => setSelectedMatch(null)} className="mt-4">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
