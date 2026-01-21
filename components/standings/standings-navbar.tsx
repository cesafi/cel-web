'use client';

import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Trophy, Target, ChevronRight } from 'lucide-react';
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
  availableSports?: Array<{ id: number; name: string }>;
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
    <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container flex flex-col lg:flex-row lg:h-16 lg:items-center lg:justify-between px-4 lg:px-6 py-3 lg:py-0 gap-3 lg:gap-4">
        {/* Left side - Stages */}
        <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
          {navigation?.stages && (
            <>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Target className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">Stages</span>
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {navigation.stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center">
                    {index > 0 && <Separator orientation="vertical" className="mx-2 h-4" />}
                    <button
                      onClick={() => onStageChange(stage.id)}
                      className={`hover:bg-muted/50 relative px-3 py-1 text-sm transition-all duration-200 whitespace-nowrap ${
                        currentStage === stage.id
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {/* Bottom accent line for selected stage */}
                      {currentStage === stage.id && (
                        <div className="bg-primary absolute right-0 bottom-0 left-0 h-0.5" />
                      )}
                      {formatCompetitionStage(stage.competition_stage)}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right side - Sports & Categories */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-4">
          {/* Sport Selector */}
          <div className="flex items-center gap-2">
            <Trophy className="text-muted-foreground h-4 w-4 hidden sm:block" />
            <span className="text-sm font-medium">Sport:</span>
            <Select
              value={currentFilters.sport_id?.toString() ?? ''}
              onValueChange={(value) => onSportChange(Number(value))}
              disabled={!currentFilters.season_id || !availableSports}
            >
              <SelectTrigger className="w-32 lg:w-40">
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                {availableSports?.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id.toString()}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-4 hidden lg:block" />

          {/* Category Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Category:</span>
            <Select
              value={currentFilters.esport_category_id?.toString() ?? ''}
              onValueChange={(value) => onCategoryChange(Number(value))}
              disabled={!currentFilters.sport_id || !availableCategories}
            >
              <SelectTrigger className="w-32 lg:w-40">
                <SelectValue placeholder="Select category" />
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

      {/* Current Selection Display */}
      <div className="border-t px-4 lg:px-6 py-2">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <span>Current selection:</span>

          {/* Season */}
          {currentFilters.season_id && (
            <>
              <Badge variant="outline">Season {currentFilters.season_id}</Badge>
              <span>•</span>
            </>
          )}

          {/* Sport */}
          {currentFilters.sport_id && availableSports && (
            <>
              <Badge variant="outline">
                {availableSports.find((s) => s.id === currentFilters.sport_id)?.name ??
                  'Unknown Sport'}
              </Badge>
              <span>•</span>
            </>
          )}

          {/* Category */}
          {currentFilters.esport_category_id && availableCategories && (
            <>
              <Badge variant="outline">
                {availableCategories.find((c) => c.id === currentFilters.esport_category_id)
                  ?.display_name ?? 'Unknown Category'}
              </Badge>
              {currentStage && <span>•</span>}
            </>
          )}

          {/* Stage */}
          {currentStage && navigation && (
            <Badge variant="default">
              {formatCompetitionStage(
                navigation.stages.find((s) => s.id === currentStage)?.competition_stage ?? ''
              )}
            </Badge>
          )}

          {/* Show message if no selections */}
          {!currentFilters.season_id &&
            !currentFilters.sport_id &&
            !currentFilters.esport_category_id &&
            !currentStage && (
              <span className="text-muted-foreground italic">No selections made</span>
            )}
        </div>
      </div>
    </div>
  );
}
