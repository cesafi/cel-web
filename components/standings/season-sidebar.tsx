'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { useAvailableSeasons } from '@/hooks/use-standings';
import { format, parseISO } from 'date-fns';

type SeasonWithDates = {
  id: number;
  name: string;
  start_at: string;
  end_at: string;
};

interface SeasonSidebarProps {
  currentSeasonId?: number;
  onSeasonChange: (seasonId: number) => void;
}

export default function SeasonSidebar({ currentSeasonId, onSeasonChange }: SeasonSidebarProps) {
  const { data: seasons, isLoading } = useAvailableSeasons();

  const formatSeasonDates = (startDate: string, endDate: string) => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const startMonth = format(start, 'MMM yyyy');
      const endMonth = format(end, 'MMM yyyy');

      return `${startMonth} - ${endMonth}`;
    } catch {
      return 'Invalid dates';
    }
  };

  if (isLoading) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Seasons
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-muted h-16 animate-pulse border-b last:border-b-0"
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Seasons
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {seasons?.map((season) => {
          const isSelected = currentSeasonId === season.id;

          return (
            <button
              key={season.id}
              onClick={() => onSeasonChange(season.id)}
              className={`hover:bg-muted/50 focus:ring-primary relative w-full border-b p-4 text-left transition-all duration-200 last:border-b-0 focus:ring-2 focus:outline-none focus:ring-inset ${isSelected ? 'bg-muted/30' : ''} `}
            >
              {/* Right accent line for selected season */}
              {isSelected && <div className="bg-primary absolute top-0 right-0 bottom-0 w-1" />}

              <div className="space-y-1">
                <div className="text-sm font-medium">Season {season.id}</div>
                <div className="text-muted-foreground text-xs">
                  {(season as SeasonWithDates).start_at && (season as SeasonWithDates).end_at
                    ? formatSeasonDates(
                        (season as SeasonWithDates).start_at,
                        (season as SeasonWithDates).end_at
                      )
                    : season.name}
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
