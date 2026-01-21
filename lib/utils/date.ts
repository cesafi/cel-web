import { format as formatDateFns, formatDistanceToNow, isToday, isYesterday, isThisWeek, isThisYear, Locale } from 'date-fns';
import { formatUtcForDisplay, formatUtcSmart, getBrowserTimezone } from './utc-time';

/**
 * Comprehensive date utility functions for consistent date formatting across the application
 * Combines dashboard utilities with sports-focused formatting patterns
 */

export interface DateFormatOptions {
  showTime?: boolean;
  showYear?: boolean;
  showRelative?: boolean;
  timeFormat?: '12h' | '24h';
  locale?: Locale;
}

// =============================================================================
// SMART DATE FORMATTING (Dashboard-focused)
// =============================================================================

/**
 * Smart date formatting that automatically chooses the best format based on recency
 */
export function formatSmartDate(
  date: Date | string | number | null | undefined,
  options: DateFormatOptions = {}
): string {
  if (!date) return 'Never';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  const { showTime = true, showRelative = true } = options;

  // Use relative time for recent dates if enabled
  if (showRelative) {
    const now = new Date();
    const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
  }

  // Smart formatting based on recency
  if (isToday(dateObj)) {
    return showTime
      ? `Today at ${formatTime(dateObj, options.timeFormat)}`
      : 'Today';
  }

  if (isYesterday(dateObj)) {
    return showTime
      ? `Yesterday at ${formatTime(dateObj, options.timeFormat)}`
      : 'Yesterday';
  }

  if (isThisWeek(dateObj)) {
    return showTime
      ? `${formatDateFns(dateObj, 'EEEE')} at ${formatTime(dateObj, options.timeFormat)}`
      : formatDateFns(dateObj, 'EEEE');
  }

  if (isThisYear(dateObj)) {
    return showTime
      ? `${formatDateFns(dateObj, 'MMM d')} at ${formatTime(dateObj, options.timeFormat)}`
      : formatDateFns(dateObj, 'MMM d');
  }

  // Older dates
  const yearFormat = options.showYear !== false ? 'MMM d, yyyy' : 'MMM d';
  const dateStr = formatDateFns(dateObj, yearFormat);

  return showTime
    ? `${dateStr} at ${formatTime(dateObj, options.timeFormat)}`
    : dateStr;
}

/**
 * Format date for table display (compact)
 */
export function formatTableDate(date: Date | string | number | null | undefined): string {
  if (!date) return '—';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid';

  if (isToday(dateObj)) {
    return 'Today';
  }

  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }

  if (isThisYear(dateObj)) {
    return formatDateFns(dateObj, 'MMM d');
  }

  return formatDateFns(dateObj, 'MMM d, yyyy');
}

/**
 * Format date with time for detailed views
 */
export function formatDetailedDate(date: Date | string | number | null | undefined): string {
  if (!date) return 'Never';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return formatDateFns(dateObj, 'PPP \'at\' p');
}

/**
 * Format relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return 'Never';

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return formatDistanceToNow(dateObj, { addSuffix: true });
}

// =============================================================================
// SPORTS-FOCUSED FORMATTING (LoL Esports inspired)
// =============================================================================

/**
 * Format date for header display (e.g., "SUNDAY Sep 7", "TODAY")
 */
export const formatDateForHeader = (date: Date): string => {
  const today = new Date();
  const isToday = isSameDay(date, today);

  if (isToday) {
    return 'TODAY';
  }

  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();

  return `${dayName} ${month} ${day}`;
};

/**
 * Format date for group display (e.g., "Wednesday Sep 10", "Yesterday", "Today")
 */
export const formatDateForGroup = (dateString: string, isToday: boolean, isYesterday: boolean): string => {
  if (isToday) {
    return 'TODAY';
  }

  if (isYesterday) {
    return 'YESTERDAY';
  }

  // Convert string to Date object
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();

  return `${dayName} ${month} ${day}`;
};

/**
 * Format date for short display (e.g., "Sep 7")
 */
export const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format full date for display (e.g., "Monday, January 15, 2024")
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// =============================================================================
// TIME FORMATTING
// =============================================================================

/**
 * Format time in 12h or 24h format
 */
export function formatTime(date: Date, timeFormat: '12h' | '24h' = '12h'): string {
  if (timeFormat === '24h') {
    return formatDateFns(date, 'HH:mm');
  }
  return formatDateFns(date, 'h:mm a');
}

// =============================================================================
// DATE COMPARISON UTILITIES
// =============================================================================

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Check if a date is in the past
 */
export const isPast = (date: Date): boolean => {
  const now = new Date();
  return date < now;
};

/**
 * Check if date is recent (within specified hours)
 */
export function isRecent(date: Date | string | number, hours: number = 24): boolean {
  if (!date) return false;

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return false;

  const now = new Date();
  const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60);

  return diffInHours <= hours;
}

/**
 * Check if date is within range
 */
export function isDateInRange(
  date: Date | string | number,
  start: Date | string | number,
  end: Date | string | number
): boolean {
  const dateObj = new Date(date);
  const startObj = new Date(start);
  const endObj = new Date(end);

  if (isNaN(dateObj.getTime()) || isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
    return false;
  }

  return dateObj >= startObj && dateObj <= endObj;
}

// =============================================================================
// DATE RANGE UTILITIES
// =============================================================================

/**
 * Format date range for periods
 */
export function formatDateRange(
  startDate: Date | string | number,
  endDate: Date | string | number
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid Date Range';
  }

  if (start.toDateString() === end.toDateString()) {
    return formatDateFns(start, 'MMM d, yyyy');
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${formatDateFns(start, 'MMM d')} - ${formatDateFns(end, 'MMM d, yyyy')}`;
  }

  return `${formatDateFns(start, 'MMM d, yyyy')} - ${formatDateFns(end, 'MMM d, yyyy')}`;
}

/**
 * Get start and end of day
 */
export function getDayBounds(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get start and end of week
 */
export function getWeekBounds(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get start and end of month
 */
export function getMonthBounds(date: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get age from date (useful for user accounts, etc.)
 */
export function getAge(birthDate: Date | string | number): number {
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

// =============================================================================
// RE-EXPORTS FROM DATE-FNS (for compatibility)
// =============================================================================

// =============================================================================
// UTC-AWARE FORMATTING (NEW)
// =============================================================================

/**
 * Format UTC date for display in user's local timezone
 * Use this for dates coming from the database
 */
export function formatUtcDate(
  utcDate: string | Date,
  options: DateFormatOptions & { timezone?: string } = {}
): string {
  const { timezone = getBrowserTimezone() } = options;
  
  if (options.showRelative) {
    return formatUtcSmart(utcDate, timezone, options);
  }
  
  return formatUtcForDisplay(utcDate, 'PPP \'at\' p', timezone);
}

/**
 * Format UTC date for table display
 */
export function formatUtcTableDate(utcDate: string | Date, timezone?: string): string {
  if (!utcDate) return '—';
  
  try {
    return formatUtcForDisplay(utcDate, 'MMM d, yyyy', timezone || getBrowserTimezone());
  } catch {
    return 'Invalid';
  }
}

/**
 * Format UTC date with smart relative formatting
 */
export function formatUtcRelative(utcDate: string | Date, timezone?: string): string {
  return formatUtcSmart(utcDate, timezone || getBrowserTimezone(), { showRelative: true });
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Re-export commonly used date-fns functions for convenience
export { isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';

// Re-export UTC utilities for convenience
export { 
  toUtcIsoString, 
  nowUtc, 
  isLiveActive, 
  isLiveExpired, 
  calculateTimeRemaining,
  getBrowserTimezone 
} from './utc-time';