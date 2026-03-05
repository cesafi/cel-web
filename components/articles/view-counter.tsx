'use client';

import { Eye } from 'lucide-react';

interface ViewCounterProps {
  count: number;
  className?: string;
}

/**
 * Displays an eye icon with a formatted view count.
 * Supports compact number formatting (e.g., 1.2K, 3.5M).
 */
export default function ViewCounter({ count, className = '' }: ViewCounterProps) {
  const formattedCount = formatViewCount(count);

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Eye className="h-3.5 w-3.5 flex-shrink-0" />
      <span>{formattedCount}</span>
    </div>
  );
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toLocaleString();
}
