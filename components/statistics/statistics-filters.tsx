'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface StatisticsFiltersProps {
  game: 'mlbb' | 'valorant';
  onGameChange: (game: 'mlbb' | 'valorant') => void;
  teams: { id: string; name: string }[];
  selectedTeam?: string;
  onTeamChange: (teamId: string) => void;
  seasons: { id: number; name: string }[];
  selectedSeason?: number;
  onSeasonChange: (seasonId: number) => void;
  onApply: () => void;
}

export function StatisticsFilters({
  game,
  onGameChange,
  teams,
  selectedTeam,
  onTeamChange,
  seasons,
  selectedSeason,
  onSeasonChange,
  onApply
}: StatisticsFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-end p-4 bg-card rounded-lg border">
      <div className="space-y-2">
        <label className="text-sm font-medium">Game</label>
        <Select value={game} onValueChange={(v) => onGameChange(v as 'mlbb' | 'valorant')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mlbb">Mobile Legends</SelectItem>
            <SelectItem value="valorant">Valorant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Team</label>
        <Select value={selectedTeam || 'all'} onValueChange={onTeamChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Season</label>
        <Select 
          value={selectedSeason?.toString() || 'all'} 
          onValueChange={(v) => onSeasonChange(parseInt(v))}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Seasons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Seasons</SelectItem>
            {seasons.map((season) => (
              <SelectItem key={season.id} value={season.id.toString()}>
                {season.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onApply}>Apply Filter</Button>
    </div>
  );
}
