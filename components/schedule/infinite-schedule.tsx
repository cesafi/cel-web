'use client';

import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScheduleMatch } from '@/lib/types/matches';
import { ScheduleDateGroup, groupMatchesByDate } from './utils';
import DateGroup from './date-group';
import DateNavigation from './date-navigation';
import FloatingNavButton from './floating-nav-button';
import { Season } from '@/lib/types/seasons';
import { EsportsSeasonStageWithDetails } from '@/lib/types/esports-seasons-stages';
import type { RichSportCategory } from './schedule-content';

// Helper function to safely get ISO date string from a Date object
function safeGetDateString(date: Date | null | undefined): string | null {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split('T')[0];
}

interface InfiniteScheduleProps {
  readonly matches: ScheduleMatch[];
  readonly onLoadMore?: (direction: 'future' | 'past') => void;
  readonly hasMoreFuture?: boolean;
  readonly hasMorePast?: boolean;
  readonly isLoading?: boolean;
  readonly isFetchingNextPage?: boolean;
  readonly isFetchingPreviousPage?: boolean;
  // New Filters
  readonly selectedEsportId?: string;
  readonly onEsportChange?: (id: string) => void;
  readonly selectedDivision?: string; // "Category"
  readonly onDivisionChange?: (division: string) => void;
  // Legacy
  readonly availableRichSports?: RichSportCategory[];
  readonly availableSeasons?: Season[];
  readonly selectedSeason?: string;
  readonly onSeasonChange?: (seasonId: string) => void;
  readonly availableStages?: EsportsSeasonStageWithDetails[];
  readonly selectedStage?: string;
  readonly onStageChange?: (stageId: string) => void;
  readonly availableSports?: string[]; // Deprecated but kept for type compat if needed temporarily
}

export default function InfiniteSchedule({
  matches,
  onLoadMore,
  hasMoreFuture = false,
  hasMorePast = false,
  isLoading = false,
  isFetchingNextPage = false,
  isFetchingPreviousPage = false,
  selectedEsportId = 'all',
  onEsportChange,
  selectedDivision = 'all',
  onDivisionChange,
  availableSports = [],
  availableRichSports = [],
  availableSeasons = [],
  selectedSeason,
  onSeasonChange,
  availableStages = [],
  selectedStage,
  onStageChange
}: InfiniteScheduleProps) {
  // Helper to ensure we always have a valid Date
  const getValidDate = (date: Date | string | null | undefined): Date => {
    if (!date) return new Date();
    const d = date instanceof Date ? date : new Date(date);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const [dateGroups, setDateGroups] = useState<ScheduleDateGroup[]>([]);
  const dateGroupsRef = useRef(dateGroups);
  useEffect(() => {
    dateGroupsRef.current = dateGroups;
  }, [dateGroups]);
  const prevScrollStateRef = useRef({ height: 0, top: 0, isPrepend: false });

  const [displayedDate, setDisplayedDate] = useState(() => getValidDate(new Date())); // Date shown on left side
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [floatingButtonDirection, setFloatingButtonDirection] = useState<'up' | 'down'>('up');
  const topObserverRef = useRef<IntersectionObserver | null>(null);
  const bottomObserverRef = useRef<IntersectionObserver | null>(null);
  const topLoadMoreRef = useRef<HTMLDivElement | null>(null);
  const bottomLoadMoreRef = useRef<HTMLDivElement | null>(null);

  // Filter matches by sport/division - memoized to prevent unnecessary re-renders
  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      let matchEsport = true;
      let matchDivision = true;

      // Filter by Esport ID
      if (selectedEsportId !== 'all') {
        matchEsport = match.esports_seasons_stages?.esports_categories?.esports?.id.toString() === selectedEsportId;
      }

      // Filter by Division ("Category")
      if (selectedDivision !== 'all') {
        matchDivision = match.esports_seasons_stages?.esports_categories?.division === selectedDivision;
      }

      return matchEsport && matchDivision;
    });
  }, [matches, selectedEsportId, selectedDivision]);

  // Group filtered matches by date
  useEffect(() => {
    const grouped = groupMatchesByDate(filteredMatches);
    const currentGroups = dateGroupsRef.current;
    
    const oldFirstDate = currentGroups.length > 0 ? currentGroups[0].date : null;
    const newFirstDate = grouped.length > 0 ? grouped[0].date : null;
    const isPrepend = !!(oldFirstDate && newFirstDate && oldFirstDate !== newFirstDate && grouped.some(g => g.date === oldFirstDate));

    if (isPrepend) {
      prevScrollStateRef.current = {
        height: document.documentElement.scrollHeight,
        top: window.scrollY,
        isPrepend: true
      };
    } else {
      prevScrollStateRef.current.isPrepend = false;
    }

    setDateGroups(grouped);
  }, [filteredMatches]);

  useLayoutEffect(() => {
    if (prevScrollStateRef.current.isPrepend) {
      const newScrollHeight = document.documentElement.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollStateRef.current.height;
      if (heightDiff > 0) {
        window.scrollBy({ top: heightDiff, behavior: 'instant' });
      }
      prevScrollStateRef.current.isPrepend = false;
    }
  }, [dateGroups]);

  // Scroll to today (or nearest date) on initial mount
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (dateGroups.length === 0 || hasScrolledRef.current) return;

    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // Find today's group or the nearest future date
    let targetGroup = dateGroups.find(g => g.date === todayString);

    if (!targetGroup) {
      // Find nearest date (closest to today)
      let closestIndex = 0;
      let minDiff = Infinity;
      dateGroups.forEach((group, index) => {
        const groupDate = getValidDate(group.date);
        const diff = Math.abs(groupDate.getTime() - today.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = index;
        }
      });
      targetGroup = dateGroups[closestIndex];
    }

    if (targetGroup) {
      // Update the displayed date to the target group's date
      setDisplayedDate(getValidDate(targetGroup.date));

      // Delay slightly to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(`date-group-${targetGroup!.date}`);
        if (element) {
          element.scrollIntoView({ behavior: 'auto', block: 'start' });
          hasScrolledRef.current = true;
        }
      }, 100);
    }
  }, [dateGroups]);

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
        setDisplayedDate(getValidDate(visibleDateGroup.date));
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
    // Top observer for loading future matches (since they appear at the top now)
    if (topObserverRef.current) {
      topObserverRef.current.disconnect();
    }

    topObserverRef.current = new IntersectionObserver(
      (entries) => {
        // Only load future if user has actually scrolled near the top (not on initial page load)
        if (entries[0].isIntersecting && hasMoreFuture && !isLoading && window.scrollY > 200) {
          onLoadMore?.('future');
        }
      },
      { threshold: 1.0, rootMargin: '-100px 0px 0px 0px' }
    );

    if (topLoadMoreRef.current) {
      topObserverRef.current.observe(topLoadMoreRef.current);
    }

    // Bottom observer for loading past matches (since they appear at the bottom now)
    if (bottomObserverRef.current) {
      bottomObserverRef.current.disconnect();
    }

    bottomObserverRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMorePast && !isLoading) {
          onLoadMore?.('past');
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

  const scrollToDateGroup = useCallback((dateStr: string) => {
    const element = document.getElementById(`date-group-${dateStr}`);
    if (element) {
      // Offset for sticky navigation headers (approx 160px for navbar + date string + filters)
      const headerOffset = 180;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setDisplayedDate(getValidDate(dateStr));
    }
  }, []);

  const handleDateChange = useCallback((targetDate: Date) => {
    if (dateGroups.length === 0) return;

    let targetGroup = dateGroups.find(g => g.date === safeGetDateString(targetDate));

    if (!targetGroup) {
      let minDiff = Infinity;
      dateGroups.forEach(g => {
        const diff = Math.abs(getValidDate(g.date).getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          targetGroup = g;
        }
      });
    }

    if (targetGroup) {
      scrollToDateGroup(targetGroup.date);
    }
  }, [dateGroups, scrollToDateGroup]);

  const handleDateNavigation = useCallback(
    (direction: 'previous' | 'next') => {
      const displayedDateStr = safeGetDateString(displayedDate);
      if (!displayedDateStr || dateGroups.length === 0) return;

      const currentIndex = dateGroups.findIndex(g => g.date === displayedDateStr);
      if (currentIndex === -1) return;

      let targetGroup = null;
      if (direction === 'previous' && currentIndex > 0) {
        targetGroup = dateGroups[currentIndex - 1];
      } else if (direction === 'next' && currentIndex < dateGroups.length - 1) {
        targetGroup = dateGroups[currentIndex + 1];
      }

      if (targetGroup) {
        scrollToDateGroup(targetGroup.date);
      }
    },
    [displayedDate, dateGroups, scrollToDateGroup]
  );

  const handleFloatingButtonClick = useCallback(() => {
    const today = new Date();
    handleDateChange(today);
  }, [handleDateChange]);

  return (
    <div className="w-full max-w-full space-y-6">
      {/* Date Navigation */}
      <DateNavigation
        currentDate={displayedDate}
        onDateChange={handleDateChange}
        _hasMatches={(() => {
          const displayedDateStr = safeGetDateString(displayedDate);
          if (!displayedDateStr) return false;
          return dateGroups.some((group) => group.date === displayedDateStr);
        })()}
        onPreviousDay={() => handleDateNavigation('previous')}
        onNextDay={() => handleDateNavigation('next')}
        selectedEsportId={selectedEsportId}
        onEsportChange={onEsportChange}
        selectedDivision={selectedDivision}
        onDivisionChange={onDivisionChange}
        availableSports={availableSports}
        availableRichSports={availableRichSports} // Pass rich data
        availableDates={dateGroups.map((group) => getValidDate(group.date))}
        hasMorePast={hasMorePast}
        hasMoreFuture={hasMoreFuture}
        availableSeasons={availableSeasons}
        selectedSeason={selectedSeason}
        onSeasonChange={onSeasonChange}
        availableStages={availableStages}
        selectedStage={selectedStage}
        onStageChange={onStageChange}
      />

      {/* Load More Future Trigger (Top) */}
      {hasMoreFuture && (
        <div ref={topLoadMoreRef} className="flex h-10 items-center justify-center py-4">
          {isFetchingNextPage && (
            <div className="flex items-center text-muted-foreground font-roboto text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading future matches...
            </div>
          )}
        </div>
      )}

      {/* All Matches - Infinite Scroll */}
      {dateGroups.length > 0 ? (
        <div className="space-y-12">
          {dateGroups.map((dateGroup, index) => (
            <motion.div
              key={dateGroup.date}
              id={`date-group-${dateGroup.date}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <DateGroup dateGroup={dateGroup} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="text-muted-foreground font-roboto">No matches found.</div>
        </div>
      )}

      {/* Load More Past Trigger (Bottom) */}
      {hasMorePast && (
        <div ref={bottomLoadMoreRef} className="flex h-10 items-center justify-center py-4">
          {isFetchingPreviousPage && (
            <div className="flex items-center text-muted-foreground font-roboto text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading past matches...
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
