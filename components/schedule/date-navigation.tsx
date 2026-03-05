'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompactGameSelector, GameOption } from '@/components/shared/filters/compact-game-selector';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isToday, formatDateHeader } from './utils';
import { Season } from '@/lib/types/seasons';
import { EsportsSeasonStageWithDetails } from '@/lib/types/esports-seasons-stages';

// Helper function to safely get ISO date string from a Date object
function safeGetDateString(date: Date | null | undefined): string | null {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split('T')[0];
}

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
  readonly selectedEsportId?: string;
  readonly onEsportChange?: (id: string) => void;
  readonly selectedDivision?: string;
  readonly onDivisionChange?: (division: string) => void;
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSeason !== 'all') count++;
    if (selectedEsportId !== 'all') count++;
    if (selectedDivision !== 'all') count++;
    if (selectedStage !== 'all') count++;
    return count;
  }, [selectedSeason, selectedEsportId, selectedDivision, selectedStage]);
  const goToPreviousDay = () => {
    if (onPreviousDay) {
      onPreviousDay();
    } else if (availableDates.length > 0) {
      const currentDateStr = safeGetDateString(currentDate);
      if (!currentDateStr) return;
      const currentIndex = availableDates.findIndex(
        (date) => safeGetDateString(date) === currentDateStr
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
      const currentDateStr = safeGetDateString(currentDate);
      if (!currentDateStr) return;
      const currentIndex = availableDates.findIndex(
        (date) => safeGetDateString(date) === currentDateStr
      );
      if (currentIndex < availableDates.length - 1) {
        onDateChange(availableDates[currentIndex + 1]);
      }
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onDateChange(today);
  };

  const handleSpecificDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number);
      const newDate = new Date(year, month - 1, day);
      onDateChange(newDate);
    }
  };

  const uniqueFilteredStages = useMemo(() => {
    const filtered = availableStages.filter(stage => {
      if (selectedSeason !== 'all' && stage.season_id !== parseInt(selectedSeason)) {
        return false;
      }
      if (selectedEsportId !== 'all') {
        if (!stage.esports_categories || stage.esports_categories.esport_id.toString() !== selectedEsportId) {
          return false;
        }
      }
      if (selectedDivision !== 'all') {
         if (!stage.esports_categories || stage.esports_categories.division !== selectedDivision) {
           return false;
         }
      }
      return true;
    });

    const uniqueMap = new Map();
    filtered.forEach(stage => {
      if (!uniqueMap.has(stage.competition_stage)) {
        uniqueMap.set(stage.competition_stage, stage);
      }
    });
    
    return Array.from(uniqueMap.values());
  }, [availableStages, selectedSeason, selectedEsportId, selectedDivision]);

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

  const uniqueDivisions = useMemo(() => {
    if (!availableRichSports || availableRichSports.length === 0) return [];

    const divisions = new Set<string>();
    availableRichSports.forEach(cat => {
       if (selectedEsportId !== 'all' && cat.esport?.id.toString() !== selectedEsportId) return;
       divisions.add(cat.division);
    });
    return Array.from(divisions).sort();
  }, [availableRichSports, selectedEsportId]);
  
  const gameOptions: GameOption[] = useMemo(() => {
    const options: GameOption[] = [{ id: 'all', name: 'All Esports', shortName: 'All Games' }];
    uniqueEsports.forEach(esport => {
      options.push({
        id: esport.id.toString(),
        name: esport.name,
        shortName: esport.abbreviation || esport.name.substring(0, 3).toUpperCase(),
        logoUrl: esport.logo_url
      });
    });
    return options;
  }, [uniqueEsports]);

  return (
    <div className="sticky top-20 z-20 mt-4 space-y-4 border border-border/60 bg-card/95 p-4 shadow-sm backdrop-blur-md md:p-5 transition-all">
      {/* Header Row: Date Title + Game Selector */}
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

         {/* Right: Game Selector */}
         <div className="hidden sm:flex items-center self-start md:self-auto overflow-x-auto pb-1 max-w-full">
            <CompactGameSelector 
              options={gameOptions}
              value={selectedEsportId}
              onChange={(val) => onEsportChange?.(val)}
              variant="buttons"
            />
         </div>
      </div>

      {/* Second Row: Date Nav + Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2 rounded-lg">
        {/* Left: Date Nav */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousDay}
            disabled={
              !hasMorePast &&
              availableDates.length > 0 &&
              (() => {
                const currentDateStr = safeGetDateString(currentDate);
                if (!currentDateStr) return true;
                return availableDates.findIndex(
                  (date) => safeGetDateString(date) === currentDateStr
                ) <= 0;
              })()
            }
            className="h-9 w-9 bg-background shadow-sm shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToToday}
            className="flex-1 md:flex-0 h-9 px-3 font-bold uppercase tracking-wide text-xs bg-background shadow-sm md:flex-none"
          >
            Today
          </Button>
          
          <div className="relative h-9 w-9 shrink-0">
             <input 
               type="date"
               value={safeGetDateString(currentDate) || ''}
               onChange={handleSpecificDateChange}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               id="date-picker-input"
             />
             <Button
               variant="outline"
               size="icon"
               className="absolute inset-0 h-9 w-9 bg-background shadow-sm pointer-events-none"
               tabIndex={-1}
             >
                <CalendarIcon className="h-4 w-4" />
             </Button>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextDay}
            disabled={
              !hasMoreFuture &&
              availableDates.length > 0 &&
              (() => {
                const currentDateStr = safeGetDateString(currentDate);
                if (!currentDateStr) return true;
                return availableDates.findIndex(
                  (date) => safeGetDateString(date) === currentDateStr
                ) >= availableDates.length - 1;
              })()
            }
            className="h-9 w-9 bg-background shadow-sm shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Mobile Filter Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="md:hidden h-9 px-3 bg-background shadow-sm shrink-0 ml-auto flex items-center gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Desktop Filters (always visible on md+) */}
        <div className="hidden md:flex w-auto overflow-x-auto pb-0">
          <div className="flex items-center gap-2 w-auto">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground mr-1">Filters:</span>
            
            {/* Season Selector */}
            {availableSeasons && availableSeasons.length > 0 && (
              <Select value={selectedSeason} onValueChange={(val) => onSeasonChange?.(val)}>
                <SelectTrigger className="h-9 w-[150px] bg-background shadow-sm font-medium text-xs">
                  <SelectValue placeholder="All Seasons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Seasons</SelectItem>
                  {availableSeasons.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name || `Season ${s.id}`}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedDivision} onValueChange={(val) => onDivisionChange?.(val)}>
              <SelectTrigger className="h-9 w-[150px] bg-background shadow-sm font-medium text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueDivisions.map((division) => (
                  <SelectItem key={division} value={division}>
                    {division}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStage} onValueChange={(val) => onStageChange?.(val)}>
              <SelectTrigger className="h-9 w-[150px] bg-background shadow-sm font-medium text-xs">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {uniqueFilteredStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.competition_stage}>
                    {stage.competition_stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile Filters Accordion (visible only on mobile) */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Season Selector */}
              {availableSeasons && availableSeasons.length > 0 && (
                <div className="col-span-2">
                  <Select value={selectedSeason} onValueChange={(val) => onSeasonChange?.(val)}>
                    <SelectTrigger className="h-9 w-full bg-background shadow-sm font-medium text-xs">
                      <SelectValue placeholder="All Seasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Seasons</SelectItem>
                      {availableSeasons.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name || `Season ${s.id}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Game Selector (mobile only) */}
              <div className="col-span-2">
                <CompactGameSelector 
                  options={gameOptions}
                  value={selectedEsportId}
                  onChange={(val) => onEsportChange?.(val)}
                  variant="dropdown"
                  className="w-full"
                />
              </div>

              {/* Category */}
              <Select value={selectedDivision} onValueChange={(val) => onDivisionChange?.(val)}>
                <SelectTrigger className="h-9 w-full bg-background shadow-sm font-medium text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueDivisions.map((division) => (
                    <SelectItem key={division} value={division}>
                      {division}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stage */}
              <Select value={selectedStage} onValueChange={(val) => onStageChange?.(val)}>
                <SelectTrigger className="h-9 w-full bg-background shadow-sm font-medium text-xs">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {uniqueFilteredStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.competition_stage}>
                      {stage.competition_stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
