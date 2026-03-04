'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FilterOption } from '@/lib/types/stats-enhanced';
import { CompactGameSelector, GameOption } from '@/components/shared/filters/compact-game-selector';
import type { EsportGame } from '@/actions/statistics';

interface FilterPanelProps {
  seasons: FilterOption[];
  stages: FilterOption[];
  categories: FilterOption[];
  teams: FilterOption[];
  selectedSeason: number | null;
  selectedStage: number | null;
  selectedCategory: number | null;
  selectedTeam: string | null;
  onSeasonChange: (seasonId: number | null) => void;
  onStageChange: (stageId: number | null) => void;
  onCategoryChange: (categoryId: number | null) => void;
  onTeamChange: (teamId: string | null) => void;
  onClearFilters: () => void;
  searchQuery?: string;
  onSearchChange?: (term: string) => void;
  isLoading?: boolean;
  className?: string;
  // New props for Game Mode selection
  game?: string;
  onGameChange?: (game: 'mlbb' | 'valorant') => void;
  esportsData?: EsportGame[];
}

const gameOptions: GameOption[] = [
  { id: 'mlbb', name: 'Mobile Legends: Bang Bang', shortName: 'MLBB' },
  { id: 'valorant', name: 'VALORANT', shortName: 'VAL' }
];

export function FilterPanel({
  seasons,
  stages,
  categories = [],
  teams = [],
  selectedSeason,
  selectedStage,
  selectedCategory,
  selectedTeam,
  onSeasonChange,
  onStageChange,
  onCategoryChange,
  onTeamChange,
  onClearFilters,
  searchQuery = '',
  onSearchChange,
  isLoading = false,
  className,
  game,
  onGameChange,
  esportsData = []
}: FilterPanelProps) {
  const hasActiveFilters = selectedSeason !== null || selectedStage !== null || selectedTeam !== null || selectedCategory !== null;

  const dynamicGameOptions: GameOption[] = esportsData.length > 0
    ? esportsData.map(e => {
      const gameId = e.name.toLowerCase().includes('valorant') ? 'valorant' : 'mlbb';
      return {
        id: gameId,
        name: e.name,
        shortName: e.abbreviation || gameId.toUpperCase(),
        logoUrl: e.logo_url
      };
    })
    : gameOptions;

  return (
    <div className={cn("w-full bg-card/40 backdrop-blur-md border border-border/50 shadow-lg rounded-xl overflow-hidden", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 sm:p-4">
        {/* Left: Game Selector Desktop */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
          {onGameChange && game && (
            <CompactGameSelector
              options={dynamicGameOptions}
              value={game}
              onChange={(val) => onGameChange(val as 'mlbb' | 'valorant')}
              variant="buttons"
            />
          )}
        </div>

        {/* Right: Search */}
        <div className="flex flex-col xl:flex-row xl:items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10 pr-10 h-10 text-sm border transition-all duration-200"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange?.('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Second Row for individual filters */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 p-3 sm:p-4 bg-muted/20 border-t border-border/50">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground mr-1 hidden sm:inline-block">Filters:</span>

        {/* Mobile Game Selector */}
        <div className="sm:hidden col-span-2">
          {onGameChange && game && (
            <CompactGameSelector
              options={dynamicGameOptions}
              value={game}
              onChange={(val) => onGameChange(val as 'mlbb' | 'valorant')}
              variant="dropdown"
              className="w-full"
            />
          )}
        </div>

        {/* Season */}
        <div className="col-span-2 sm:col-span-auto w-full sm:w-auto order-first sm:order-none mb-1 sm:mb-0">
          <Select value={selectedSeason?.toString() || 'all'} onValueChange={(val) => onSeasonChange(val === 'all' ? null : Number(val))}>
            <SelectTrigger className="h-9 w-full sm:w-[150px] bg-background shadow-sm font-medium text-xs">
              <SelectValue placeholder="All Seasons" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <Select value={selectedCategory?.toString() || 'all'} onValueChange={(val) => onCategoryChange(val === 'all' ? null : Number(val))}>
          <SelectTrigger className="h-9 w-full sm:w-[150px] bg-background shadow-sm font-medium text-xs">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Stage */}
        <Select value={selectedStage?.toString() || 'all'} onValueChange={(val) => onStageChange(val === 'all' ? null : Number(val))} disabled={!selectedSeason || !selectedCategory}>
          <SelectTrigger className="h-9 w-full sm:w-[150px] bg-background shadow-sm font-medium text-xs">
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stages.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Team */}
        <Select value={selectedTeam || 'all'} onValueChange={(val) => onTeamChange(val === 'all' ? null : val)} disabled={!selectedSeason}>
          <SelectTrigger className="h-9 w-full sm:w-[150px] bg-background shadow-sm font-medium text-xs">
            <SelectValue placeholder="All Teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground col-span-2 sm:col-span-auto hover:text-destructive transition-colors h-9 ml-auto"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
