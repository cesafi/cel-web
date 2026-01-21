'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatUtcSmart, formatUtcForDisplay, getBrowserTimezone } from '@/lib/utils/utc-time';
import { roboto } from '@/lib/fonts';

interface SmartDateTimeProps {
  /** UTC date string or Date object */
  date: string | Date | null | undefined;
  /** Display variant */
  variant?: 'full' | 'compact' | 'relative' | 'table' | 'live';
  /** Show timezone information */
  showTimezone?: boolean;
  /** Show icon */
  showIcon?: boolean;
  /** Time format preference */
  timeFormat?: '12h' | '24h';
  /** Custom timezone (defaults to browser timezone) */
  timezone?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show live indicator for active events */
  isLive?: boolean;
  /** Show countdown for future events */
  showCountdown?: boolean;
}

export function SmartDateTime({
  date,
  variant = 'full',
  showTimezone = false,
  showIcon = true,
  timeFormat = '12h',
  timezone,
  className,
  isLive = false,
  showCountdown: _showCountdown = false
}: SmartDateTimeProps) {
  const [_currentTime, setCurrentTime] = useState<Date>(new Date());
  const [userTimezone, setUserTimezone] = useState<string>('');

  useEffect(() => {
    // Set timezone on client side to avoid hydration mismatch
    setUserTimezone(timezone || getBrowserTimezone());

    // Update current time every second for live updates
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [timezone]);

  if (!date) {
    return (
      <span className={cn('text-muted-foreground text-sm', className)}>
        —
      </span>
    );
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return (
      <span className={cn('text-destructive text-sm', className)}>
        Invalid Date
      </span>
    );
  }

  // Calculate if event is live or upcoming
  const now = new Date();
  const isActive = isLive && dateObj > now;
  const isPast = dateObj < now;

  // Format based on variant
  const getFormattedDate = () => {
    switch (variant) {
      case 'compact':
        return formatUtcForDisplay(date, 'MMM d', userTimezone);
      
      case 'relative':
        return formatUtcSmart(date, userTimezone, { 
          showRelative: true, 
          timeFormat 
        });
      
      case 'table':
        if (isPast) {
          return formatUtcSmart(date, userTimezone, { 
            showRelative: true, 
            showTime: false 
          });
        }
        return formatUtcForDisplay(date, 'MMM d, yyyy', userTimezone);
      
      case 'live':
        if (isActive) {
          const timeUntil = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
          const hours = Math.floor(timeUntil / 3600);
          const minutes = Math.floor((timeUntil % 3600) / 60);
          const seconds = timeUntil % 60;
          
          if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
          } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
          } else {
            return `${seconds}s`;
          }
        }
        return formatUtcSmart(date, userTimezone, { timeFormat });
      
      case 'full':
      default:
        return formatUtcForDisplay(date, 'PPP \'at\' p', userTimezone);
    }
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    if (variant === 'live' && isActive) {
      return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
    }
    
    if (showTimezone) {
      return <Globe className="w-4 h-4" />;
    }
    
    return variant === 'compact' || variant === 'table' 
      ? <Calendar className="w-3 h-3" />
      : <Clock className="w-4 h-4" />;
  };

  const getTimezoneInfo = () => {
    if (!showTimezone || !userTimezone) return null;
    
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        timeZoneName: 'short'
      });
      
      const parts = formatter.formatToParts(new Date());
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      const tzAbbr = timeZonePart?.value || userTimezone.split('/')[1]?.replace('_', ' ') || 'Local';
      
      return (
        <span className="text-xs text-muted-foreground ml-1">
          ({tzAbbr})
        </span>
      );
    } catch {
      return null;
    }
  };

  const getSizeClasses = () => {
    switch (variant) {
      case 'compact':
      case 'table':
        return 'text-xs';
      case 'live':
        return isActive ? 'text-sm font-mono font-semibold' : 'text-sm';
      default:
        return 'text-sm';
    }
  };

  const getColorClasses = () => {
    if (variant === 'live' && isActive) {
      return 'text-red-600 dark:text-red-400';
    }
    if (isPast && variant !== 'table') {
      return 'text-muted-foreground';
    }
    return 'text-foreground';
  };

  return (
    <div className={cn(
      'flex items-center gap-2',
      getSizeClasses(),
      getColorClasses(),
      roboto.className,
      className
    )}>
      {getIcon()}
      <span className={variant === 'live' && isActive ? 'font-mono' : ''}>
        {getFormattedDate()}
      </span>
      {getTimezoneInfo()}
    </div>
  );
}

// Preset components for common use cases
export function TableDateTime({ date, className }: { date: string | Date | null | undefined; className?: string }) {
  return (
    <SmartDateTime
      date={date}
      variant="table"
      showIcon={true}
      showTimezone={false}
      className={className}
    />
  );
}

export function CompactDateTime({ date, className }: { date: string | Date | null | undefined; className?: string }) {
  return (
    <SmartDateTime
      date={date}
      variant="compact"
      showIcon={true}
      showTimezone={false}
      className={className}
    />
  );
}

export function LiveDateTime({ 
  date, 
  isLive = false, 
  className 
}: { 
  date: string | Date | null | undefined; 
  isLive?: boolean;
  className?: string;
}) {
  return (
    <SmartDateTime
      date={date}
      variant="live"
      showIcon={true}
      showTimezone={false}
      isLive={isLive}
      className={className}
    />
  );
}

export function RelativeDateTime({ date, className }: { date: string | Date | null | undefined; className?: string }) {
  return (
    <SmartDateTime
      date={date}
      variant="relative"
      showIcon={true}
      showTimezone={false}
      className={className}
    />
  );
}