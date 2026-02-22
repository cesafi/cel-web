import { ScheduleMatch } from '@/lib/types/matches';
import { isYesterday, formatDate } from '@/lib/utils/date';

export interface ScheduleDateGroup {
  date: string;
  displayDate: string;
  isToday: boolean;
  isYesterday: boolean;
  isPast: boolean;
  matches: ScheduleMatch[];
}

// School logo mapping - this function is deprecated
// Use useSchoolLogoByAbbreviationGetter hook from @/hooks/use-school-logos instead
export const getSchoolLogo = (_schoolAbbreviation: string): string => {
  // Fallback for backward compatibility - components should use the hook instead
  return '/img/cesafi-logo.webp';
};

// Date formatting utilities are in @/lib/utils/date

export const isUpcoming = (date: Date): boolean => {
  const now = new Date();
  return date > now;
};

// Group matches by date - ALL date computation happens here (client-side)
// This ensures correct timezone handling since the browser knows the user's timezone
export const groupMatchesByDate = (matches: ScheduleMatch[]): ScheduleDateGroup[] => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const grouped = matches.reduce(
    (acc, match) => {
      let matchDate = new Date(match.scheduled_at ?? new Date());
      if (isNaN(matchDate.getTime())) {
        console.warn('Invalid match date:', match.scheduled_at, match);
        matchDate = new Date();
      }

      // Derive local date key from the browser's timezone interpretation
      const year = matchDate.getFullYear();
      const month = String(matchDate.getMonth() + 1).padStart(2, '0');
      const day = String(matchDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      // Format display date client-side (browser timezone)
      const showYear = year !== currentYear;
      const displayDate = matchDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        ...(showYear ? { year: 'numeric' } : {})
      });

      // Format display time client-side (browser timezone)
      const displayTime = matchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      // Enrich the match with client-computed fields
      const enrichedMatch: ScheduleMatch = {
        ...match,
        localIsoDate: dateKey,
        displayDate,
        displayTime,
        isToday: dateKey === todayStr,
        isPast: matchDate < now
      };

      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          displayDate,
          isToday: dateKey === todayStr,
          isYesterday: isYesterday(matchDate),
          isPast: matchDate < now,
          matches: []
        };
      }
      acc[dateKey].matches.push(enrichedMatch);
      return acc;
    },
    {} as Record<string, ScheduleDateGroup>
  );

  return Object.values(grouped).sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
};

// Determine winner for completed matches
export const determineWinner = (
  participants: Array<{
    id: number;
    teamName: string;
    schoolName: string;
    schoolAbbreviation: string;
    schoolLogo: string | null;
    score: number | null;
    isWinner?: boolean;
  }>
) => {
  if (participants.length !== 2) return participants;

  const [team1, team2] = participants;

  if (team1.score === null || team2.score === null) {
    return participants; // Match not completed
  }

  if (team1.score > team2.score) {
    return [
      { ...team1, isWinner: true },
      { ...team2, isWinner: false }
    ];
  } else if (team2.score > team1.score) {
    return [
      { ...team1, isWinner: false },
      { ...team2, isWinner: true }
    ];
  }

  return participants; // Tie
};

// Additional utility functions for date navigation
export const isToday = (date: Date | null | undefined): boolean => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return false;
  }
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

// Format date for header display - two lines like "SUNDAY" and "Sep 14"
export const formatDateHeader = (date: Date | null | undefined): { weekday: string; date: string } => {
  // Handle invalid or null dates
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    const today = new Date();
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const dateStr = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    return { weekday, date: dateStr };
  }

  const currentYear = new Date().getFullYear();
  const showYear = date.getFullYear() !== currentYear;

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(showYear ? { year: 'numeric' } : {})
  });

  return {
    weekday,
    date: dateStr
  };
};
