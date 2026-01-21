/**
 * Utility functions for the schedule feature
 */

import { ScheduleMatch } from '@/lib/types/matches';

/**
 * Format a date for display in the schedule
 */
export function formatScheduleDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateKey = dateObj.toISOString().split('T')[0];
  const todayKey = today.toISOString().split('T')[0];
  const tomorrowKey = tomorrow.toISOString().split('T')[0];
  const yesterdayKey = yesterday.toISOString().split('T')[0];

  if (dateKey === todayKey) {
    return 'Today';
  } else if (dateKey === tomorrowKey) {
    return 'Tomorrow';
  } else if (dateKey === yesterdayKey) {
    return 'Yesterday';
  } else {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * Format time for display in the schedule
 */
export function formatScheduleTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Group matches by date for the schedule view
 */
export function groupMatchesByDate(matches: ScheduleMatch[]): Record<string, ScheduleMatch[]> {
  const grouped: Record<string, ScheduleMatch[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  matches.forEach((match) => {
    if (match.scheduled_at) {
      const matchDate = new Date(match.scheduled_at);
      const dateKey = matchDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }

      // Add display properties
      const displayMatch: ScheduleMatch = {
        ...match,
        displayDate: dateKey,
        displayTime: formatScheduleTime(matchDate),
        isToday: dateKey === today.toISOString().split('T')[0],
        isPast: matchDate < now
      };

      grouped[dateKey].push(displayMatch);
    }
  });

  // Sort matches within each date group by time
  Object.keys(grouped).forEach((dateKey) => {
    grouped[dateKey].sort((a, b) => {
      if (!a.scheduled_at || !b.scheduled_at) return 0;
      return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
    });
  });

  return grouped;
}

/**
 * Sort date keys chronologically
 */
export function sortDateKeys(dateKeys: string[]): string[] {
  return dateKeys.sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime();
  });
}

/**
 * Get the current date as a cursor for pagination
 */
export function getCurrentDateCursor(): string {
  return new Date().toISOString();
}

/**
 * Check if a match is happening today
 */
export function isMatchToday(match: ScheduleMatch): boolean {
  if (!match.scheduled_at) return false;
  const matchDate = new Date(match.scheduled_at);
  const today = new Date();
  return matchDate.toDateString() === today.toDateString();
}

/**
 * Check if a match is happening this week
 */
export function isMatchThisWeek(match: ScheduleMatch): boolean {
  if (!match.scheduled_at) return false;
  const matchDate = new Date(match.scheduled_at);
  const today = new Date();
  const weekFromNow = new Date(today);
  weekFromNow.setDate(today.getDate() + 7);

  return matchDate >= today && matchDate <= weekFromNow;
}

/**
 * Get the status color for a match
 */
export function getMatchStatusColor(match: ScheduleMatch): string {
  if (match.status === 'finished') return 'text-green-600';
  if (match.status === 'live') return 'text-blue-600';
  if (match.status === 'canceled') return 'text-red-600';
  if (match.isPast) return 'text-muted-foreground';
  return 'text-foreground';
}

/**
 * Format the sport and category information for display
 */
export function formatSportInfo(match: ScheduleMatch): string {
  const sport = match.esports_seasons_stages?.esports_categories?.esports?.name || 'Unknown Sport';
  const category = match.esports_seasons_stages?.esports_categories?.levels || '';
  const stage = match.esports_seasons_stages?.competition_stage || '';

  let result = sport;
  if (category) result += ` - ${category}`;
  if (stage) result += ` (${stage})`;

  return result;
}

/**
 * Get the best of format for display
 */
export function formatBestOf(match: ScheduleMatch): string {
  if (!match.best_of || match.best_of <= 1) return 'Single Game';
  return `Best of ${match.best_of}`;
}

/**
 * Get the relative time for a match (e.g., "in 2 hours", "2 hours ago")
 */
export function getRelativeTime(match: ScheduleMatch): string {
  if (!match.scheduled_at) return 'TBD';

  const matchDate = new Date(match.scheduled_at);
  const now = new Date();
  const diffMs = matchDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (Math.abs(diffDays) >= 1) {
    return diffDays > 0
      ? `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
      : `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
  } else if (Math.abs(diffHours) >= 1) {
    return diffHours > 0
      ? `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
      : `${Math.abs(diffHours)} hour${Math.abs(diffHours) > 1 ? 's' : ''} ago`;
  } else {
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    if (Math.abs(diffMinutes) < 1) return 'now';
    return diffMinutes > 0 ? `in ${diffMinutes} min` : `${Math.abs(diffMinutes)} min ago`;
  }
}

/**
 * Get the status badge variant for UI components
 */
export function getMatchStatusVariant(
  match: ScheduleMatch
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (match.status === 'finished') return 'default';
  if (match.status === 'live') return 'secondary';
  if (match.status === 'canceled') return 'destructive';
  if (match.isPast) return 'outline';
  return 'default';
}

/**
 * Check if a match has multiple participants (for track & field, swimming, etc.)
 */
export function hasMultipleParticipants(match: ScheduleMatch): boolean {
  return match.match_participants && match.match_participants.length > 2;
}

/**
 * Get the winner of a match (if finished)
 */
export function getMatchWinner(
  match: ScheduleMatch
): ScheduleMatch['match_participants'][0] | null {
  if (match.status !== 'finished' || !match.match_participants) return null;

  // Find participant with highest score
  return match.match_participants.reduce(
    (winner, participant) => {
      if (!winner) return participant;
      const winnerScore = winner.match_score ?? 0;
      const participantScore = participant.match_score ?? 0;
      return participantScore > winnerScore ? participant : winner;
    },
    null as ScheduleMatch['match_participants'][0] | null
  );
}

/**
 * Format participant count for display
 */
export function formatParticipantCount(match: ScheduleMatch): string {
  const count = match.match_participants?.length ?? 0;
  if (count === 0) return 'No participants';
  if (count === 1) return '1 participant';
  if (count === 2) return '2 participants';
  return `${count} participants`;
}

/**
 * Get the venue display text
 */
export function getVenueDisplay(match: ScheduleMatch): string {
  return match.venue || 'TBD';
}

/**
 * Check if a match is live (ongoing and within reasonable time window)
 */
export function isMatchLive(match: ScheduleMatch): boolean {
  if (match.status !== 'live') return false;

  if (!match.start_at) return true; // If no start time, assume it's live if status is ongoing

  const startTime = new Date(match.start_at);
  const now = new Date();
  const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  // Consider live if started within last 6 hours
  return hoursSinceStart >= 0 && hoursSinceStart <= 6;
}
