'use client';

import { useSeason } from '@/components/contexts/season-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function SeasonSwitcher() {
  const { currentSeason, availableSeasons, switchSeason, isLoading, error } = useSeason();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="text-muted-foreground text-xs">Loading...</span>
      </div>
    );
  }

  if (error || !currentSeason || availableSeasons.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-muted-foreground text-xs">No seasons</span>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center space-x-2">
      {/* Compact Season Switcher */}
      <Select
        value={currentSeason.id.toString()}
        onValueChange={(value) => switchSeason(parseInt(value))}
      >
        <SelectTrigger className="hover:bg-muted/50 border-border w-full border bg-transparent">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableSeasons.map((season) => {
            return (
              <SelectItem key={season.id} value={season.id.toString()}>
                <div className="flex items-center space-x-2 font-medium">
                  <span>Season {season.id}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
