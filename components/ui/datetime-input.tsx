'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toUtcIsoString, getBrowserTimezone } from '@/lib/utils/utc-time';

interface DateTimeInputProps {
  id?: string;
  label?: string | React.ReactNode;
  value?: string | null; // UTC ISO string
  onChange?: (utcIsoString: string | null) => void;
  className?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
}

export function DateTimeInput({
  id,
  label,
  value,
  onChange,
  className,
  error,
  helpText,
  required = false,
  disabled = false
}: DateTimeInputProps) {
  const [localValue, setLocalValue] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('');

  useEffect(() => {
    // Set timezone on client side to avoid hydration mismatch
    setTimezone(getBrowserTimezone());
  }, []);

  useEffect(() => {
    // Convert UTC value to local datetime-local format
    if (value && timezone) {
      try {
        const utcDate = new Date(value);
        // Convert to local time and format for datetime-local input
        const localDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
        const localIsoString = localDate.toISOString().slice(0, 16);
        setLocalValue(localIsoString);
      } catch (error) {
        console.error('Error converting UTC date to local:', error);
        setLocalValue('');
      }
    } else {
      setLocalValue('');
    }
  }, [value, timezone]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);

    if (!inputValue) {
      onChange?.(null);
      return;
    }

    try {
      // Convert local datetime-local value to UTC ISO string
      const localDate = new Date(inputValue);
      const utcIsoString = toUtcIsoString(localDate);
      onChange?.(utcIsoString);
    } catch (error) {
      console.error('Error converting local date to UTC:', error);
      onChange?.(null);
    }
  };

  const getTimezoneDisplay = () => {
    if (!timezone) return '';
    
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'short'
      });
      
      const parts = formatter.formatToParts(new Date());
      const timeZonePart = parts.find(part => part.type === 'timeZoneName');
      return timeZonePart?.value || timezone.split('/')[1]?.replace('_', ' ') || 'Local';
    } catch {
      return 'Local';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={id} className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}>
          {label}
        </Label>
      )}
      
      <Input
        id={id}
        type="datetime-local"
        value={localValue}
        onChange={handleChange}
        className={cn(error ? 'border-red-500' : '', className)}
        disabled={disabled}
        required={required}
      />
      
      {(helpText || timezone) && (
        <div className="space-y-1">
          {helpText && (
            <p className="text-xs text-muted-foreground">
              {helpText}
            </p>
          )}
          {timezone && (
            <p className="text-xs text-muted-foreground">
              Your timezone: {getTimezoneDisplay()} • Stored as UTC in database
            </p>
          )}
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}