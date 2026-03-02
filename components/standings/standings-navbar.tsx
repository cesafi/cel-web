'use client';

import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompactGameSelector, GameOption } from '@/components/shared/filters/compact-game-selector';
//
import {
  StandingsNavigation as StandingsNavigationType,
  StandingsFilters
} from '@/lib/types/standings';

interface StandingsNavbarProps {
  currentFilters: StandingsFilters;
  onSportChange: (sportId: number) => void;
  onCategoryChange: (categoryId: number) => void;
  onStageChange: (stageId: number) => void;
  navigation?: StandingsNavigationType;
  currentStage?: number;
  availableSports?: Array<{ id: number; name: string; logo_url: string | null; abbreviation: string | null }>;
  availableCategories?: Array<{ id: number; display_name: string }>;
}

export default function StandingsNavbar({
  currentFilters,
  onSportChange,
  onCategoryChange,
  onStageChange,
  navigation,
  currentStage,
  availableSports,
  availableCategories
}: StandingsNavbarProps) {
  const formatCompetitionStage = (stage: string) => {
    switch (stage) {
      case 'group_stage':
        return 'Group Stage';
      case 'playins':
        return 'Play-ins';
      case 'playoffs':
        return 'Playoffs';
      case 'finals':
        return 'Finals';
      default:
        return stage;
    }
  };

  const gameOptions: GameOption[] = useMemo(() => {
    if (!availableSports) return [];
    return availableSports.map(sport => ({
      id: sport.id.toString(),
      name: sport.name,
      shortName: sport.abbreviation || sport.name.substring(0, 3).toUpperCase(),
      logoUrl: sport.logo_url
    }));
  }, [availableSports]);

  return (
    <div className="bg-background border-b z-10 sticky top-0">
      <div className="flex flex-col">
        {/* Row 1: Filters & Context */}
         <div className="container px-3 sm:px-4 py-2 sm:py-3 border-b border-border/40">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             {/* Left: Game Selector Desktop */}
             <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
                <CompactGameSelector 
                  options={gameOptions}
                  value={currentFilters.sport_id?.toString() || ''}
                  onChange={(val) => onSportChange(Number(val))}
                  variant="buttons"
                />
             </div>

             {/* Right: Category Dropdown & Mobile Game Selector */}
             <div className="grid grid-cols-2 sm:flex sm:flex-row items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
               <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground mr-1 hidden sm:inline-block">Filter:</span>
               
               <div className="sm:hidden w-full">
                 <CompactGameSelector 
                   options={gameOptions}
                   value={currentFilters.sport_id?.toString() || ''}
                   onChange={(val) => onSportChange(Number(val))}
                   variant="dropdown"
                 />
               </div>

               <Select 
                 value={currentFilters.esport_category_id?.toString() || ''} 
                 onValueChange={(val) => onCategoryChange(Number(val))}
               >
                 <SelectTrigger className="h-9 w-full sm:w-[200px] bg-background shadow-sm font-medium text-xs">
                   <SelectValue placeholder="Select Category" />
                 </SelectTrigger>
                 <SelectContent>
                   {availableCategories?.map((category) => (
                     <SelectItem key={category.id} value={category.id.toString()}>
                       {category.display_name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
           </div>
        </div>

        {/* Row 2: Stage Tabs */}
        {navigation?.stages && navigation.stages.length > 0 && (
            <div className="container px-3 sm:px-4">
              <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar">
               {navigation.stages.map((stage) => {
                 const isActive = currentStage === stage.id;
                 return (
                   <button
                     key={stage.id}
                     onClick={() => onStageChange(stage.id)}
                     className={`relative py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                       isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                     }`}
                   >
                     {formatCompetitionStage(stage.competition_stage)}
                     {isActive && (
                       <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                     )}
                   </button>
                 );
               })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
