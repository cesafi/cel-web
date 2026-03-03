'use client';

interface LocalTimeProps {
  dateString: string;
  format?: 'date' | 'time' | 'datetime';
  dateOptions?: Intl.DateTimeFormatOptions;
  timeOptions?: Intl.DateTimeFormatOptions;
  className?: string;
}

/**
 * Client-side time formatting component.
 * Uses suppressHydrationWarning to avoid mismatch between server (UTC) and client (browser TZ).
 */
export function LocalTime({
  dateString,
  format = 'datetime',
  dateOptions = { weekday: 'short', month: 'short', day: 'numeric' },
  timeOptions = { hour: '2-digit', minute: '2-digit' },
  className,
}: LocalTimeProps) {
  const date = new Date(dateString);

  let display = '';
  if (format === 'date') {
    display = date.toLocaleDateString('en-US', dateOptions);
  } else if (format === 'time') {
    display = date.toLocaleTimeString('en-US', timeOptions);
  } else {
    display = `${date.toLocaleDateString('en-US', dateOptions)} ${date.toLocaleTimeString('en-US', timeOptions)}`;
  }

  return (
    <time dateTime={dateString} suppressHydrationWarning className={className}>
      {display}
    </time>
  );
}
