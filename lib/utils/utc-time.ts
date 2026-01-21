/**
 * UTC-first time utilities for consistent database storage and client display
 * 
 * Best Practices:
 * 1. Always store dates in UTC (ISO 8601 format) in the database
 * 2. Convert to user's local timezone only for display
 * 3. Use these utilities for all time-related operations
 */

import { format as formatDateFns, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// =============================================================================
// UTC CONVERSION UTILITIES
// =============================================================================

/**
 * Convert a local date to UTC ISO string for database storage
 * Use this when saving dates to the database
 */
export function toUtcIsoString(date: Date | string | number): string {
  const dateObj = new Date(date);
  return dateObj.toISOString();
}

/**
 * Convert a local date/time to UTC for a specific timezone
 * Useful when you know the user's timezone and want to store their local time as UTC
 */
export function localToUtc(date: Date | string, timezone: string): Date {
  // For date-fns-tz v2+, we need to handle this differently
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const zonedDate = toZonedTime(dateObj, timezone);
  return new Date(zonedDate.getTime() - (zonedDate.getTimezoneOffset() * 60000));
}

/**
 * Convert UTC date to user's local timezone
 * Use this when displaying dates from the database
 */
export function utcToLocal(utcDate: Date | string, timezone?: string): Date {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  if (timezone) {
    return toZonedTime(dateObj, timezone);
  }
  
  // Use browser's timezone if none specified
  return new Date(dateObj.toLocaleString());
}

/**
 * Get current UTC time as ISO string
 * Use this for timestamps when creating/updating records
 */
export function nowUtc(): string {
  return new Date().toISOString();
}

/**
 * Get current time in user's timezone
 */
export function nowLocal(timezone?: string): Date {
  if (timezone) {
    return toZonedTime(new Date(), timezone);
  }
  return new Date();
}

// =============================================================================
// LIVE STATUS UTILITIES (UTC-AWARE)
// =============================================================================

/**
 * Check if a live event is currently active (UTC-aware)
 */
export function isLiveActive(startUtc?: string | Date, endUtc?: string | Date): boolean {
  if (!startUtc || !endUtc) return false;
  
  const now = new Date(); // Current UTC time
  const start = new Date(startUtc);
  const end = new Date(endUtc);
  
  return now >= start && now <= end;
}

/**
 * Check if a live event has expired (UTC-aware)
 */
export function isLiveExpired(endUtc?: string | Date): boolean {
  if (!endUtc) return false;
  
  const now = new Date(); // Current UTC time
  const end = new Date(endUtc);
  
  return now > end;
}

/**
 * Calculate time remaining until live event ends (UTC-aware)
 */
export function calculateTimeRemaining(endUtc: string | Date): string | null {
  const now = new Date(); // Current UTC time
  const end = new Date(endUtc);
  const diffMs = end.getTime() - now.getTime();

  if (diffMs <= 0) return null; // Expired

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Calculate time until live event starts (UTC-aware)
 */
export function calculateTimeUntilStart(startUtc: string | Date): string | null {
  const now = new Date(); // Current UTC time
  const start = new Date(startUtc);
  const diffMs = start.getTime() - now.getTime();

  if (diffMs <= 0) return null; // Already started

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// =============================================================================
// DISPLAY FORMATTING (TIMEZONE-AWARE)
// =============================================================================

/**
 * Format UTC date for display in user's timezone
 */
export function formatUtcForDisplay(
  utcDate: string | Date,
  formatStr: string = 'PPP \'at\' p',
  timezone?: string
): string {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  if (timezone) {
    return formatInTimeZone(dateObj, timezone, formatStr);
  }
  
  // Use browser's timezone
  return formatDateFns(dateObj, formatStr);
}

/**
 * Format UTC date for smart display (relative when recent, absolute when older)
 */
export function formatUtcSmart(
  utcDate: string | Date,
  timezone?: string,
  options: {
    showTime?: boolean;
    showRelative?: boolean;
    timeFormat?: '12h' | '24h';
  } = {}
): string {
  const { showTime = true, showRelative = true, timeFormat = '12h' } = options;
  
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const localDate = timezone ? toZonedTime(dateObj, timezone) : dateObj;
  
  // Use relative time for recent dates if enabled
  if (showRelative) {
    const now = timezone ? toZonedTime(new Date(), timezone) : new Date();
    const diffInHours = (now.getTime() - localDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
  }

  // Smart formatting based on recency
  if (isToday(localDate)) {
    return showTime
      ? `Today at ${formatTime(localDate, timeFormat)}`
      : 'Today';
  }

  if (isYesterday(localDate)) {
    return showTime
      ? `Yesterday at ${formatTime(localDate, timeFormat)}`
      : 'Yesterday';
  }

  if (isThisWeek(localDate)) {
    return showTime
      ? `${formatDateFns(localDate, 'EEEE')} at ${formatTime(localDate, timeFormat)}`
      : formatDateFns(localDate, 'EEEE');
  }

  if (isThisYear(localDate)) {
    return showTime
      ? `${formatDateFns(localDate, 'MMM d')} at ${formatTime(localDate, timeFormat)}`
      : formatDateFns(localDate, 'MMM d');
  }

  // Older dates
  const dateStr = formatDateFns(localDate, 'MMM d, yyyy');
  return showTime
    ? `${dateStr} at ${formatTime(localDate, timeFormat)}`
    : dateStr;
}

/**
 * Format time in 12h or 24h format
 */
function formatTime(date: Date, timeFormat: '12h' | '24h' = '12h'): string {
  if (timeFormat === '24h') {
    return formatDateFns(date, 'HH:mm');
  }
  return formatDateFns(date, 'h:mm a');
}

/**
 * Format UTC date for live event display
 */
export function formatLiveEventTime(
  startUtc?: string | Date,
  endUtc?: string | Date,
  timezone?: string
): {
  startFormatted: string;
  endFormatted: string;
  isActive: boolean;
  isExpired: boolean;
  timeRemaining: string | null;
  timeUntilStart: string | null;
} {
  const isActive = isLiveActive(startUtc, endUtc);
  const isExpired = endUtc ? isLiveExpired(endUtc) : false;
  const timeRemaining = endUtc ? calculateTimeRemaining(endUtc) : null;
  const timeUntilStart = startUtc ? calculateTimeUntilStart(startUtc) : null;

  return {
    startFormatted: startUtc ? formatUtcForDisplay(startUtc, 'PPP \'at\' p', timezone) : '',
    endFormatted: endUtc ? formatUtcForDisplay(endUtc, 'PPP \'at\' p', timezone) : '',
    isActive,
    isExpired,
    timeRemaining,
    timeUntilStart
  };
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate that a date string is a valid UTC ISO string
 */
export function isValidUtcIsoString(dateString: string): boolean {
  try {
    const date = new Date(dateString);
    return date.toISOString() === dateString;
  } catch {
    return false;
  }
}

/**
 * Ensure a date is converted to UTC ISO string
 */
export function ensureUtcIsoString(date: Date | string | number): string {
  if (typeof date === 'string' && isValidUtcIsoString(date)) {
    return date;
  }
  return toUtcIsoString(date);
}

// =============================================================================
// BROWSER TIMEZONE DETECTION
// =============================================================================

/**
 * Get user's browser timezone
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get timezone offset in minutes
 */
export function getTimezoneOffset(timezone?: string): number {
  if (timezone) {
    const now = new Date();
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const local = toZonedTime(utc, timezone);
    return (utc.getTime() - local.getTime()) / 60000;
  }
  return new Date().getTimezoneOffset();
}