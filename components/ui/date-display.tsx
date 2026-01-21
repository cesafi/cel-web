import { formatSmartDate, formatTableDate, formatDetailedDate, formatRelativeTime } from '@/lib/utils/date';

interface DateDisplayProps {
  date: Date | string | number | null | undefined;
  variant?: 'smart' | 'table' | 'detailed' | 'relative';
  showTime?: boolean;
  showRelative?: boolean;
  timeFormat?: '12h' | '24h';
  className?: string;
}

/**
 * Reusable component for displaying dates with consistent formatting
 */
export function DateDisplay({
  date,
  variant = 'smart',
  showTime = true,
  showRelative = true,
  timeFormat = '12h',
  className = ''
}: DateDisplayProps) {
  if (!date) {
    return <span className={`text-muted-foreground ${className}`}>Never</span>;
  }

  let formattedDate: string;

  switch (variant) {
    case 'table':
      formattedDate = formatTableDate(date);
      break;
    case 'detailed':
      formattedDate = formatDetailedDate(date);
      break;
    case 'relative':
      formattedDate = formatRelativeTime(date);
      break;
    case 'smart':
    default:
      formattedDate = formatSmartDate(date, {
        showTime,
        showRelative,
        timeFormat
      });
      break;
  }

  return (
    <span className={className} title={formatDetailedDate(date)}>
      {formattedDate}
    </span>
  );
}

/**
 * Compact date display for tables
 */
export function TableDate({ date, className = '' }: { date: Date | string | number | null | undefined; className?: string }) {
  return <DateDisplay date={date} variant="table" className={className} />;
}

/**
 * Smart date display with relative time
 */
export function SmartDate({ 
  date, 
  showTime = true, 
  showRelative = true, 
  className = '' 
}: { 
  date: Date | string | number | null | undefined; 
  showTime?: boolean; 
  showRelative?: boolean; 
  className?: string; 
}) {
  return (
    <DateDisplay 
      date={date} 
      variant="smart" 
      showTime={showTime} 
      showRelative={showRelative} 
      className={className} 
    />
  );
}

/**
 * Relative time display (e.g., "2 hours ago")
 */
export function RelativeDate({ date, className = '' }: { date: Date | string | number | null | undefined; className?: string }) {
  return <DateDisplay date={date} variant="relative" className={className} />;
}

/**
 * Detailed date display with full format
 */
export function DetailedDate({ date, className = '' }: { date: Date | string | number | null | undefined; className?: string }) {
  return <DateDisplay date={date} variant="detailed" className={className} />;
}
