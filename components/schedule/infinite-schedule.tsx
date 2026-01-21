'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ScheduleMatch } from '@/lib/types/matches';
import { ScheduleDateGroup, groupMatchesByDate } from './utils';
import DateGroup from './date-group';
import DateNavigation from './date-navigation';
import FloatingNavButton from './floating-nav-button';

interface InfiniteScheduleProps {
  readonly matches: ScheduleMatch[];
  readonly onMatchClick?: (match: ScheduleMatch) => void;
  readonly onLoadMore?: (direction: 'future' | 'past') => void;
  readonly hasMoreFuture?: boolean;
  readonly hasMorePast?: boolean;
  readonly isLoading?: boolean;
  readonly selectedSport?: string;
  readonly onSportChange?: (sport: string) => void;
  readonly availableSports?: string[];
}

export default function InfiniteSchedule({
  matches,
  onMatchClick,
  onLoadMore,
  hasMoreFuture = false,
  hasMorePast = false,
  isLoading = false,
  selectedSport = 'all',
  onSportChange,
  availableSports = [
    'Basketball',
    'Volleyball',
    'Football',
    'Tennis',
    'Badminton',
    'Track and Field',
    'Swimming'
  ]
}: InfiniteScheduleProps) {
  const [dateGroups, setDateGroups] = useState<ScheduleDateGroup[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [displayedDate, setDisplayedDate] = useState(new Date()); // Date shown on left side
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [floatingButtonDirection, setFloatingButtonDirection] = useState<'up' | 'down'>('up');
  const topObserverRef = useRef<IntersectionObserver | null>(null);
  const bottomObserverRef = useRef<IntersectionObserver | null>(null);
  const topLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const bottomLoadMoreRef = useRef<HTMLDivElement | null>(null);

  // Filter matches by sport - memoized to prevent unnecessary re-renders
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      if (selectedSport === 'all') return true;
      return match.esports_seasons_stages?.esports_categories?.esports?.name === selectedSport;
    });
  }, [matches, selectedSport]);

  // Group filtered matches by date
  useEffect(() => {
    const grouped = groupMatchesByDate(filteredMatches);
    setDateGroups(grouped);
  }, [filteredMatches]);

  // Handle scroll detection for floating button and displayed date
  useEffect(() => {
    const handleScroll = () => {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      const todayGroup = dateGroups.find((group) => group.date === todayString);

      // Find the currently visible date group
      let visibleDateGroup: ScheduleDateGroup | null = null;
      let minDistance = Infinity;

      for (const group of dateGroups) {
        const element = document.getElementById(`date-group-${group.date}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distanceFromTop = Math.abs(rect.top);

          // If the element is visible in the viewport
          if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
            if (distanceFromTop < minDistance) {
              minDistance = distanceFromTop;
              visibleDateGroup = group;
            }
          }
        }
      }

      // Update displayed date if we found a visible group
      if (visibleDateGroup) {
        setDisplayedDate(new Date(visibleDateGroup.date));
      }

      // Floating button logic - only show when scrolled away from today
      if (!todayGroup) {
        // If no today group, don't show floating button
        setShowFloatingButton(false);
        return;
      }

      const todayElement = document.getElementById(`date-group-${todayString}`);
      if (!todayElement) {
        setShowFloatingButton(false);
        return;
      }

      const rect = todayElement.getBoundingClientRect();
      const isTodayVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isTodayVisible) {
        setShowFloatingButton(true);
        // Determine direction based on scroll position
        if (rect.top < 0) {
          setFloatingButtonDirection('up'); // We're below today, need to go up
        } else {
          setFloatingButtonDirection('down'); // We're above today, need to go down
        }
      } else {
        setShowFloatingButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [dateGroups]);

  // Set up intersection observers for infinite scroll
  useEffect(() => {
    // Top observer for loading past matches
    if (topObserverRef.current) {
      topObserverRef.current.disconnect();
    }

    topObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePast && !isLoading) {
          onLoadMore?.('past');
        }
      },
      { threshold: 0.1 }
    );

    if (topLoadMoreRef.current) {
      topObserverRef.current.observe(topLoadMoreRef.current);
    }

    // Bottom observer for loading future matches
    if (bottomObserverRef.current) {
      bottomObserverRef.current.disconnect();
    }

    bottomObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreFuture && !isLoading) {
          onLoadMore?.('future');
        }
      },
      { threshold: 0.1 }
    );

    if (bottomLoadMoreRef.current) {
      bottomObserverRef.current.observe(bottomLoadMoreRef.current);
    }

    return () => {
      if (topObserverRef.current) {
        topObserverRef.current.disconnect();
      }
      if (bottomObserverRef.current) {
        bottomObserverRef.current.disconnect();
      }
    };
  }, [hasMorePast, hasMoreFuture, isLoading, onLoadMore]);

  const handleDateNavigation = useCallback(
    (direction: 'previous' | 'next') => {
      const targetDate = new Date(currentDate);
      if (direction === 'previous') {
        targetDate.setDate(targetDate.getDate() - 1);
      } else {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      // Find the date group for the target date
      const targetDateString = targetDate.toISOString().split('T')[0];
      const targetGroup = dateGroups.find((group) => group.date === targetDateString);

      if (targetGroup) {
        // Scroll to the target date group
        const element = document.getElementById(`date-group-${targetDateString}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      setCurrentDate(targetDate);
    },
    [currentDate, dateGroups]
  );

  const handleFloatingButtonClick = useCallback(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const todayGroup = dateGroups.find((group) => group.date === todayString);

    if (todayGroup) {
      const element = document.getElementById(`date-group-${todayString}`);
      if (element) {
        // Calculate offset to center the element in the viewport
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.scrollY;
        const offset = window.innerHeight / 2 - elementRect.height / 2;
        const targetPosition = absoluteElementTop - offset;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }

    setCurrentDate(today);
  }, [dateGroups]);

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Date Navigation */}
      <DateNavigation
        currentDate={displayedDate}
        onDateChange={setCurrentDate}
        _hasMatches={dateGroups.some(
          (group) => group.date === displayedDate.toISOString().split('T')[0]
        )}
        onPreviousDay={() => handleDateNavigation('previous')}
        onNextDay={() => handleDateNavigation('next')}
        selectedSport={selectedSport}
        onSportChange={onSportChange}
        availableSports={availableSports}
        availableDates={dateGroups.map((group) => new Date(group.date))}
        hasMorePast={hasMorePast}
        hasMoreFuture={hasMoreFuture}
      />

      {/* Load More Past Trigger */}
      {hasMorePast && (
        <div ref={topLoadMoreRef} className="flex h-10 items-center justify-center">
          {isLoading && (
            <div className="text-muted-foreground font-roboto text-sm">Loading past matches...</div>
          )}
        </div>
      )}

      {/* All Matches - Infinite Scroll */}
      {dateGroups.length > 0 ? (
        <div className="space-y-12">
          {dateGroups.map((dateGroup) => (
            <div key={dateGroup.date} id={`date-group-${dateGroup.date}`}>
              <DateGroup dateGroup={dateGroup} onMatchClick={onMatchClick} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="text-muted-foreground font-roboto">No matches found.</div>
        </div>
      )}

      {/* Load More Future Trigger */}
      {hasMoreFuture && (
        <div ref={bottomLoadMoreRef} className="flex h-10 items-center justify-center">
          {isLoading && (
            <div className="text-muted-foreground font-roboto text-sm">
              Loading future matches...
            </div>
          )}
        </div>
      )}

      {/* Floating Navigation Button */}
      <FloatingNavButton
        isVisible={showFloatingButton}
        direction={floatingButtonDirection}
        onClick={handleFloatingButtonClick}
      />
    </div>
  );
}
