'use client';

import { useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAllEsports, useAllEsportCategories } from '@/hooks/use-esports';
import { useAllEsportsSeasonsStages } from '@/hooks/use-esports-seasons-stages';
import { useSeason } from '@/components/contexts/season-provider';
import { formatCategoryName } from '@/lib/utils/esports';

interface LeagueStageSelectorProps {
  selectedSportId: number | null;
  selectedCategoryId: number | null;
  selectedStageId: number | null;
  onSportChange: (id: number) => void;
  onCategoryChange: (id: number) => void;
  onStageChange: (id: number) => void;
  className?: string;
}

export function LeagueStageSelector({
  selectedSportId,
  selectedCategoryId,
  selectedStageId,
  onSportChange,
  onCategoryChange,
  onStageChange,
  className
}: LeagueStageSelectorProps) {
  // Get current season from context
  const { currentSeason } = useSeason();

  // Fetch all sports
  const {
    data: allSports = [],
    isLoading: isSportsLoading
  } = useAllEsports();

  // Fetch all categories
  const {
    data: allCategories = [],
    isLoading: isCategoriesLoading
  } = useAllEsportCategories();

  // Fetch all stages
  const { 
    data: allStages = [], 
    isLoading: isStagesLoading 
  } = useAllEsportsSeasonsStages();

  // Memoize filtered data to prevent unnecessary re-renders
  const filteredCategories = useMemo(() => {
    if (!allCategories || !selectedSportId) return [];
    return allCategories.filter(category => category.esport_id === selectedSportId);
  }, [allCategories, selectedSportId]);

  // Filter stages by BOTH category AND current season
  const filteredStages = useMemo(() => {
    if (!allStages || !selectedCategoryId) return [];
    return allStages.filter(stage => 
      stage.esport_category_id === selectedCategoryId &&
      (!currentSeason || stage.season_id === currentSeason.id)
    );
  }, [allStages, selectedCategoryId, currentSeason]);


  // Auto-select first sport if none selected
  useEffect(() => {
    if (!selectedSportId && allSports && allSports.length > 0) {
      onSportChange(allSports[0].id);
    }
  }, [selectedSportId, allSports, onSportChange]);

  // Auto-select first category if none selected and sport is selected
  useEffect(() => {
    if (selectedSportId && !selectedCategoryId && filteredCategories.length > 0) {
      onCategoryChange(filteredCategories[0].id);
    }
  }, [selectedSportId, selectedCategoryId, filteredCategories, onCategoryChange]);

  // Auto-select first stage if none selected and category is selected
  useEffect(() => {
    if (selectedCategoryId && !selectedStageId && filteredStages.length > 0) {
      onStageChange(filteredStages[0].id);
    }
  }, [selectedCategoryId, selectedStageId, filteredStages, onStageChange]);

  // Show loading state
  if (isSportsLoading || isCategoriesLoading || isStagesLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-sm text-muted-foreground">
          Loading sports and categories...
        </div>
      </div>
    );
  }

  // Show error state if no sports available
  if (!allSports || allSports.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-sm text-muted-foreground">
          No sports available
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Sport Selection */}
      <div className="space-y-2">
        <Label htmlFor="sport-selector">Esport</Label>
        <Select value={selectedSportId?.toString()} onValueChange={(value) => onSportChange(parseInt(value))}>
          <SelectTrigger id="sport-selector" className="w-full">
            <SelectValue placeholder="Select a sport" />
          </SelectTrigger>
          <SelectContent>
            {allSports.map((sport) => (
              <SelectItem key={sport.id} value={sport.id.toString()}>
                {sport.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sport Category Selection */}
      <div className="space-y-2">
        <Label htmlFor="sport-category-selector">Esport Category</Label>
        <Select 
          value={selectedCategoryId?.toString()} 
          onValueChange={(value) => onCategoryChange(parseInt(value))}
          disabled={!selectedSportId}
        >
          <SelectTrigger id="sport-category-selector" className="w-full">
            <SelectValue placeholder={selectedSportId ? "Select a category" : "Select a sport first"} />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {formatCategoryName(category)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSportId && filteredCategories.length === 0 && (
          <div className="text-xs text-muted-foreground">
            No categories available for selected sport
          </div>
        )}
      </div>

      {/* League Stage Selection */}
      <div className="space-y-2">
        <Label htmlFor="stage-selector">League Stage</Label>
        <Select 
          value={selectedStageId?.toString()} 
          onValueChange={(value) => onStageChange(parseInt(value))}
          disabled={!selectedCategoryId}
        >
          <SelectTrigger id="stage-selector" className="w-full">
            <SelectValue placeholder={selectedCategoryId ? "Select a stage" : "Select a sport category first"} />
          </SelectTrigger>
          <SelectContent>
            {filteredStages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id.toString()}>
                {stage.competition_stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategoryId && filteredStages.length === 0 && (
          <div className="text-xs text-muted-foreground">
            No stages available for selected category
          </div>
        )}
      </div>
    </div>
  );
}
