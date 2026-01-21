'use client';

import { ScheduleMatch } from '@/lib/types/matches';
import { formatScheduleDate } from '@/lib/utils/schedule-utils';
import { ScheduleMatchCard } from './schedule-match-card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface ScheduleDateGroupProps {
  readonly date: string;
  readonly matches: ScheduleMatch[];
  readonly onMatchClick?: (match: ScheduleMatch) => void;
  readonly className?: string;
}

export function ScheduleDateGroup({
  date,
  matches,
  onMatchClick,
  className
}: ScheduleDateGroupProps) {
  const formattedDate = formatScheduleDate(date);
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;

  return (
    <div className={className}>
      {/* Date Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground h-5 w-5" />
          <h2 className="text-xl font-bold">{formattedDate}</h2>
        </div>
        <Badge variant={isToday ? 'default' : 'secondary'}>
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </Badge>
      </div>

      {/* Matches */}
      <div className="space-y-4">
        {matches.map((match, index) => (
          <div key={match.id}>
            <ScheduleMatchCard match={match} onClick={onMatchClick} />
            {index < matches.length - 1 && <Separator className="my-4" />}
          </div>
        ))}
      </div>
    </div>
  );
}
