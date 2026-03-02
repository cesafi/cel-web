'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { ScheduleDateGroup } from './utils';
import { ScheduleMatch } from '@/lib/types/matches';
import MatchCard from './match-card';

interface DateGroupProps {
  readonly dateGroup: ScheduleDateGroup;
}

export default function DateGroup({ dateGroup }: DateGroupProps) {
  return (
    <div className="space-y-4">
      {/* Date Header - Left aligned, above the container */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-2">
          {/* LoL Esports often hides the icon for 'Today', but we'll keep the bold title */}
          {!dateGroup.isToday && <Calendar className="text-muted-foreground h-5 w-5" />}
          <h2 className="text-foreground text-xl font-bold tracking-wide">
            {dateGroup.isToday ? 'Today' : dateGroup.displayDate}
          </h2>
        </div>
        {dateGroup.matches.length > 0 && (
          <div className="text-muted-foreground font-roboto text-sm">
            {dateGroup.matches.length} match{dateGroup.matches.length !== 1 ? 'es' : ''}
          </div>
        )}
      </div>

      {dateGroup.matches.length > 0 ? (
        <div
          className={`space-y-3 ${dateGroup.isToday ? 'rounded-xl p-4 from-primary/5 to-primary/10 bg-gradient-to-b border border-primary/10' : ''}`}
        >
          {dateGroup.matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        /* LoL Esports Style Empty Box */
        <div className="bg-card dark:bg-[#1c1c1c] border border-border/40 rounded-xl p-6 shadow-sm">
           <h3 className="text-foreground text-base font-bold mb-1 tracking-tight">
               No Matches Scheduled {dateGroup.isToday ? 'Today' : 'on This Date'}
           </h3>
           <p className="text-muted-foreground text-sm opacity-80">
               Check back soon to find more matches
           </p>
        </div>
      )}
    </div>
  );
}
