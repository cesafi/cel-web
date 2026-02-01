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

// Group matches by date
export const groupMatchesByDate = (matches: ScheduleMatch[]): ScheduleDateGroup[] => {
  const grouped = matches.reduce(
    (acc, match) => {
      let matchDate = new Date(match.scheduled_at ?? new Date());
      // Handle invalid date
      if (isNaN(matchDate.getTime())) {
        console.warn('Invalid match date:', match.scheduled_at, match);
        // Fallback to today to avoid crash, or skip?
        // Let's fallback to today so it appears somewhere
        matchDate = new Date();
      }

      const date = match.displayDate ?? matchDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date: date,
          displayDate: formatDate(matchDate),
          isToday: match.isToday ?? false,
          isYesterday: isYesterday(matchDate),
          isPast: match.isPast ?? false,
          matches: []
        };
      }
      acc[date].matches.push(match);
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
    // Return today's date as fallback
    const today = new Date();
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    const dateStr = today.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    return { weekday, date: dateStr };
  }

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return {
    weekday,
    date: dateStr
  };
};
