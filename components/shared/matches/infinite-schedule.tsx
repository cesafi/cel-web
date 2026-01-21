'use client';

import { useEffect, useRef } from 'react';
import { ScheduleMatch, ScheduleFilters } from '@/lib/types/matches';
import { useInfiniteSchedule } from '@/hooks/use-schedule';
import { ScheduleDateGroup } from './schedule-date-group';
import { groupMatchesByDate, sortDateKeys } from '@/lib/utils/schedule-utils';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteScheduleProps {
  readonly limit?: number;
  readonly direction?: 'future' | 'past';
  readonly filters?: ScheduleFilters;
  readonly onMatchClick?: (match: ScheduleMatch) => void;
  readonly className?: string;
}

export function InfiniteSchedule({
  limit = 20,
  direction = 'future',
  filters = {},
  onMatchClick,
  className
}: InfiniteScheduleProps) {
  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    isFetchingNextPage,
    isFetchingPreviousPage,
    error
  } = useInfiniteSchedule({
    limit,
    direction,
    filters
  });

  const topObserverRef = useRef<HTMLDivElement>(null);
  const bottomObserverRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const topObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasPreviousPage && !isFetchingPreviousPage) {
          fetchPreviousPage();
        }
      },
      { threshold: 0.1 }
    );

    const bottomObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (topObserverRef.current) {
      topObserver.observe(topObserverRef.current);
    }
    if (bottomObserverRef.current) {
      bottomObserver.observe(bottomObserverRef.current);
    }

    return () => {
      topObserver.disconnect();
      bottomObserver.disconnect();
    };
  }, [
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    fetchNextPage,
    fetchPreviousPage
  ]);

  // Group matches by date
  const groupedMatches = groupMatchesByDate(data?.matches || []);
  const sortedDateKeys = sortDateKeys(Object.keys(groupedMatches));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-red-600">Failed to load schedule</p>
        <p className="text-muted-foreground mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  if (!data?.matches || data.matches.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No matches found</p>
        <p className="text-muted-foreground mt-1 text-sm">
          Try adjusting your filters or check back later
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Load Previous Button */}
      {hasPreviousPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchPreviousPage()}
            disabled={isFetchingPreviousPage}
            className="flex items-center gap-2"
          >
            {isFetchingPreviousPage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
            Load More Past Matches
          </Button>
        </div>
      )}

      {/* Top Observer */}
      <div ref={topObserverRef} className="h-4" />

      {/* Date Groups */}
      {sortedDateKeys.map((dateKey) => (
        <ScheduleDateGroup
          key={dateKey}
          date={dateKey}
          matches={groupedMatches[dateKey]}
          onMatchClick={onMatchClick}
        />
      ))}

      {/* Bottom Observer */}
      <div ref={bottomObserverRef} className="h-4" />

      {/* Load Next Button */}
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2"
          >
            {isFetchingNextPage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Load More Future Matches
          </Button>
        </div>
      )}

      {/* Loading indicators */}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground ml-2 text-sm">Loading more matches...</span>
        </div>
      )}

      {isFetchingPreviousPage && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-muted-foreground ml-2 text-sm">Loading past matches...</span>
        </div>
      )}
    </div>
  );
}
