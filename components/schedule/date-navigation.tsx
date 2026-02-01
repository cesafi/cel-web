'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight, Settings, Filter } from 'lucide-react';
import { isToday, formatDateHeader } from './utils';
import { Season } from '@/lib/types/seasons';
import { EsportsSeasonStageWithDetails } from '@/lib/types/esports-seasons-stages';
import { FilterTabs } from './filter-tabs';

// Define RichSportCategory locally to match schedule-content or import if preferred
interface RichSportCategory {
  id: number;
  division: string;
  levels: string;
  full_name: string;
  formatted_name?: string;
  esport: {
    id: number;
    name: string;
    logo_url: string | null;
    abbreviation: string | null;
  } | null;
}

interface DateNavigationProps {
  readonly currentDate: Date;
  readonly onDateChange: (date: Date) => void;
  readonly _hasMatches: boolean;
  readonly onPreviousDay?: () => void;
  readonly onNextDay?: () => void;
  // New Filters
  readonly selectedEsportId?: string;
  readonly onEsportChange?: (id: string) => void;
  readonly selectedDivision?: string;
  readonly onDivisionChange?: (division: string) => void;
  // Legacy/Fallback
  readonly availableSports?: string[];
  readonly availableRichSports?: RichSportCategory[];
  readonly availableDates?: Date[];
  readonly hasMorePast?: boolean;
  readonly hasMoreFuture?: boolean;
  readonly availableSeasons?: Season[];
  readonly selectedSeason?: string;
  readonly onSeasonChange?: (seasonId: string) => void;
  readonly availableStages?: EsportsSeasonStageWithDetails[];
  readonly selectedStage?: string;
  readonly onStageChange?: (stageId: string) => void;
}

export default function DateNavigation({
  currentDate,
  onDateChange,
  _hasMatches,
  onPreviousDay,
  onNextDay,
  selectedEsportId = 'all',
  onEsportChange,
  selectedDivision = 'all',
  onDivisionChange,
  availableSports = [],
  availableRichSports = [],
  availableDates = [],
  hasMorePast = false,
  hasMoreFuture = false,
  availableSeasons = [],
  selectedSeason = 'all',
  onSeasonChange,
  availableStages = [],
  selectedStage = 'all',
  onStageChange
}: DateNavigationProps) {
  const goToPreviousDay = () => {
    if (onPreviousDay) {
      onPreviousDay();
    } else if (availableDates.length > 0) {
      const currentIndex = availableDates.findIndex(
        (date) => date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
      );
      if (currentIndex > 0) {
        onDateChange(availableDates[currentIndex - 1]);
      }
    }
  };

  const goToNextDay = () => {
    if (onNextDay) {
      onNextDay();
    } else if (availableDates.length > 0) {
      const currentIndex = availableDates.findIndex(
        (date) => date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
      );
      if (currentIndex < availableDates.length - 1) {
        onDateChange(availableDates[currentIndex + 1]);
      }
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    onDateChange(today);
  };

  // Filter stages based on selected season if applicable
  const filteredStages = availableStages.filter(stage => {
    if (selectedSeason === 'all') return true;
    return stage.season_id === parseInt(selectedSeason);
  });

  // Extract Unique Esports
  const uniqueEsports = useMemo(() => {
    if (!availableRichSports || availableRichSports.length === 0) return [];
    
    const map = new Map();
    availableRichSports.forEach(cat => {
      if (cat.esport && !map.has(cat.esport.id)) {
        map.set(cat.esport.id, cat.esport);
      }
    });
    return Array.from(map.values());
  }, [availableRichSports]);

  // Extract Unique Divisions (filtered by Esport if selected)
  const uniqueDivisions = useMemo(() => {
    if (!availableRichSports || availableRichSports.length === 0) return [];

    const divisions = new Set<string>();
    availableRichSports.forEach(cat => {
       // If esport selected, only show divisions for that esport
       if (selectedEsportId !== 'all' && cat.esport?.id.toString() !== selectedEsportId) return;
       divisions.add(cat.division);
    });
    return Array.from(divisions).sort();
  }, [availableRichSports, selectedEsportId]);
  
  const currentEsportName = useMemo(() => {
     if (selectedEsportId === 'all') return null;
     return uniqueEsports.find(e => e.id.toString() === selectedEsportId)?.name || 'Selected';
  }, [selectedEsportId, uniqueEsports]);

  return (
    <div className="sticky top-20 z-20 mt-4 space-y-4 rounded-xl border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-md md:p-5 transition-all">
      {/* Header Row: Date Title + Date Nav + Settings */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
         {/* Left: Current Date Title */}
         <div className="flex flex-col">
            <div className="font-mango-grotesque text-muted-foreground text-sm font-medium uppercase tracking-wide">
              {isToday(currentDate) ? 'TODAY' : formatDateHeader(currentDate).weekday}
            </div>
            <div className="font-mango-grotesque text-foreground text-4xl font-bold leading-none">
              {isToday(currentDate) ? formatDateHeader(new Date()).date : formatDateHeader(currentDate).date}
            </div>
         </div>

         {/* Right: Controls */}
         <div className="flex items-center gap-3 self-start md:self-auto">
             {/* Date Nav */}
             <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousDay}
                disabled={
                  !hasMorePast &&
                  availableDates.length > 0 &&
                  availableDates.findIndex(
                    (date) =>
                      date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
                  ) <= 0
                }
                className="h-8 w-8 rounded-md hover:bg-background hover:shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoToToday}
                className="h-8 px-3 font-bold uppercase tracking-wide text-xs rounded-md hover:bg-background hover:shadow-sm"
              >
                Today
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextDay}
                disabled={
                  !hasMoreFuture &&
                  availableDates.length > 0 &&
                  availableDates.findIndex(
                    (date) =>
                      date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0]
                  ) >=
                    availableDates.length - 1
                }
                className="h-8 w-8 rounded-md hover:bg-background hover:shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Combined Settings Gear */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="h-10 px-4 rounded-lg border-border/50 bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-300 gap-2 shadow-sm">
                  <Settings className="h-4 w-4" />
                  <span className="font-bold uppercase tracking-wide text-xs">All Filters</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Filter Matches</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Esport Filter Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-3">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Esport</span>
                    {selectedEsportId !== 'all' && (
                       <span className="ml-auto text-xs text-primary font-bold max-w-[100px] truncate">
                         {currentEsportName}
                       </span>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 max-h-[300px] overflow-y-auto">
                    <DropdownMenuRadioGroup value={selectedEsportId} onValueChange={onEsportChange}>
                      <DropdownMenuRadioItem value="all" className="py-2">All Esports</DropdownMenuRadioItem>
                      {uniqueEsports.map((esport) => (
                           <DropdownMenuRadioItem key={esport.id} value={esport.id.toString()} className="py-2 items-center">
                              <div className="flex items-center gap-3 w-full">
                                {esport.logo_url ? (
                                   // eslint-disable-next-line @next/next/no-img-element
                                   <img src={esport.logo_url} alt={esport.name} className="w-6 h-6 object-contain" />
                                ) : (
                                   <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-[10px] font-bold">
                                     {esport.abbreviation?.substring(0,2) || 'SP'}
                                   </div>
                                )}
                                <div className="flex flex-col">
                                   <span className="font-bold text-sm leading-none">{esport.name}</span>
                                </div>
                              </div>
                           </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Category (Division) Filter Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-3">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>Category</span>
                    {selectedDivision !== 'all' && (
                       <span className="ml-auto text-xs text-primary font-bold max-w-[100px] truncate">
                         {selectedDivision}
                       </span>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56 overflow-y-auto max-h-[300px]">
                    <DropdownMenuRadioGroup value={selectedDivision} onValueChange={onDivisionChange}>
                      <DropdownMenuRadioItem value="all" className="py-2">All Categories</DropdownMenuRadioItem>
                      {uniqueDivisions.map((division) => (
                        <DropdownMenuRadioItem key={division} value={division} className="py-2">
                          {division}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Stage Filter Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-3">
                    <Filter className="mr-2 h-4 w-4" />
                    <span>League Stage</span>
                    {selectedStage !== 'all' && (
                       <span className="ml-auto text-xs text-primary font-bold truncate max-w-[80px]">
                         {filteredStages.find(s => s.id.toString() === selectedStage)?.competition_stage || 'Selected'}
                       </span>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    <DropdownMenuRadioGroup value={selectedStage} onValueChange={onStageChange}>
                      <DropdownMenuRadioItem value="all" className="py-2">All Stages</DropdownMenuRadioItem>
                      {filteredStages.map((stage) => (
                        <DropdownMenuRadioItem key={stage.id} value={stage.id.toString()} className="py-2">
                          {stage.competition_stage}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
         </div>
      </div>

       {/* Season Tabs Row - Kept Visible as requested */}
       <div>
          <FilterTabs 
            options={[
              { value: 'all', label: 'All' },
              ...availableSeasons.map(season => ({
                value: season.id.toString(),
                label: `Season ${season.id}`
              }))
            ]}
            value={selectedSeason || 'all'}
            onChange={onSeasonChange || (() => {})}
            className="mt-2" // Add subtle spacing
          />
       </div>
    </div>
  );
}
