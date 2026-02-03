'use client';

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
import { Button } from '@/components/ui/button';
import { Settings, Trophy, Target, ChevronRight } from 'lucide-react';
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

  return (
    <div className="bg-background border-b z-10 sticky top-0">
      <div className="flex flex-col">
        {/* Row 1: Filters & Context */}
        <div className="container px-4 py-3 border-b border-border/40">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             {/* Left: Filter Summary / Title */}
             <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Filters:</span>
                    {availableSports?.find(s => s.id === currentFilters.sport_id)?.name || 'All Sports'}
                    <span>•</span>
                    {availableCategories?.find(c => c.id === currentFilters.esport_category_id)?.display_name || 'All Categories'}
                 </div>
             </div>

             {/* Right: All Filters Button */}
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="default" className="h-10 px-4 rounded-lg border-border/50 bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-300 gap-2 shadow-sm">
                  <Settings className="h-4 w-4" />
                  <span className="font-bold uppercase tracking-wide text-xs">All Filters</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel>Filter Standings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Esport Filter Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-3">
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>Esport</span>
                    {currentFilters.sport_id && (
                       <span className="ml-auto text-xs text-primary font-bold max-w-[100px] truncate">
                         {availableSports?.find(s => s.id === currentFilters.sport_id)?.name}
                       </span>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-72 max-h-[300px] overflow-y-auto">
                    <DropdownMenuRadioGroup value={currentFilters.sport_id?.toString()} onValueChange={(val) => onSportChange(Number(val))}>
                      {availableSports?.map((sport) => (
                           <DropdownMenuRadioItem key={sport.id} value={sport.id.toString()} className="py-2 items-center">
                              <div className="flex items-center gap-3 w-full">
                                {sport.logo_url ? (
                                   // eslint-disable-next-line @next/next/no-img-element
                                   <img src={sport.logo_url} alt={sport.name} className="w-6 h-6 object-contain" />
                                ) : (
                                   <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center text-[10px] font-bold">
                                     {sport.abbreviation?.substring(0,2) || sport.name.substring(0,2)}
                                   </div>
                                )}
                                <div className="flex flex-col">
                                   <span className="font-bold text-sm leading-none">{sport.name}</span>
                                </div>
                              </div>
                           </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                {/* Category Filter Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="py-3">
                    <Target className="mr-2 h-4 w-4" />
                    <span>Category</span>
                    {currentFilters.esport_category_id && (
                       <span className="ml-auto text-xs text-primary font-bold max-w-[100px] truncate">
                         {availableCategories?.find(c => c.id === currentFilters.esport_category_id)?.display_name}
                       </span>
                    )}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56 overflow-y-auto max-h-[300px]">
                    <DropdownMenuRadioGroup value={currentFilters.esport_category_id?.toString()} onValueChange={(val) => onCategoryChange(Number(val))}>
                      {availableCategories?.map((category) => (
                        <DropdownMenuRadioItem key={category.id} value={category.id.toString()} className="py-2">
                          {category.display_name}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
           </div>
        </div>

        {/* Row 2: Stage Tabs */}
        {navigation?.stages && navigation.stages.length > 0 && (
          <div className="container px-4">
            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
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
