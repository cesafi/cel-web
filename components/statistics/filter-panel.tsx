'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Filter, Settings, X, Calendar, Swords, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { FilterOption } from '@/lib/types/stats-enhanced';

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
    isLoading?: boolean;
    className?: string;
}

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
    isLoading = false,
    className,
}: FilterPanelProps) {
    const hasActiveFilters = selectedSeason !== null || selectedStage !== null || selectedTeam !== null || selectedCategory !== null;

    // Helper to get labels
    const getSeasonLabel = () => seasons.find(s => s.id === selectedSeason)?.label || 'All Seasons';
    const getStageLabel = () => stages.find(s => s.id === selectedStage)?.label || 'All Stages';
    const getCategoryLabel = () => categories.find(c => c.id === selectedCategory)?.label || 'All Categories';
    const getTeamLabel = () => teams.find(s => s.value === selectedTeam)?.label || 'All Teams';

    return (
        <div className={cn("w-full bg-card/40 backdrop-blur-md border border-border/50 shadow-lg rounded-xl overflow-hidden", className)}>
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                 {/* Left: Filter Summary */}
                 <div className="flex items-center gap-2">
                     <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Filters:
                        </span>
                        <span className={cn(selectedSeason && "text-foreground font-medium")}>{getSeasonLabel()}</span>
                        <span>•</span>
                        <span className={cn(selectedCategory && "text-foreground font-medium")}>{getCategoryLabel()}</span>
                        <span>•</span>
                        <span className={cn(selectedStage && "text-foreground font-medium")}>{getStageLabel()}</span>
                        <span>•</span>
                        <span className={cn(selectedTeam && "text-foreground font-medium")}>{getTeamLabel()}</span>
                     </div>
                 </div>

                 {/* Right: All Filters Button */}
                 <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearFilters}
                            className="hidden sm:flex text-muted-foreground hover:text-destructive transition-colors h-9"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Clear
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="default" className="h-10 px-4 rounded-lg border-border/50 bg-background/50 hover:bg-accent hover:text-accent-foreground transition-all duration-300 gap-2 shadow-sm font-bold uppercase tracking-wide text-xs">
                                <Settings className="h-4 h-4" />
                                All Filters
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-80" align="end">
                            <DropdownMenuLabel>Filter Statistics</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* Season Filter */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="py-3 cursor-pointer">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>Season</span>
                                    {selectedSeason && (
                                        <span className="ml-auto text-xs text-primary font-bold max-w-[100px] truncate">
                                            {getSeasonLabel()}
                                        </span>
                                    )}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-56 max-h-[300px] overflow-y-auto">
                                    <DropdownMenuRadioGroup value={selectedSeason?.toString() || 'all'} onValueChange={(val) => onSeasonChange(val === 'all' ? null : Number(val))}>
                                        <DropdownMenuRadioItem value="all" className="cursor-pointer">All Seasons</DropdownMenuRadioItem>
                                        {seasons.map((season) => (
                                            <DropdownMenuRadioItem key={season.id} value={season.id.toString()} className="cursor-pointer">
                                                {season.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Stage Filter */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="py-3 cursor-pointer" disabled={!selectedSeason}>
                                    <Swords className="mr-2 h-4 w-4" />
                                    <span>Stage</span>
                                    {selectedStage && (
                                        <span className="ml-auto text-xs text-primary font-bold max-w-[100px] truncate">
                                            {getStageLabel()}
                                        </span>
                                    )}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-64 max-h-[300px] overflow-y-auto">
                                    <DropdownMenuRadioGroup value={selectedStage?.toString() || 'all'} onValueChange={(val) => onStageChange(val === 'all' ? null : Number(val))}>
                                        <DropdownMenuRadioItem value="all" className="cursor-pointer">All Stages</DropdownMenuRadioItem>
                                        {stages.map((stage) => (
                                            <DropdownMenuRadioItem key={stage.id} value={stage.id.toString()} className="cursor-pointer">
                                                {stage.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Category Filter */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="py-3 cursor-pointer">
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Category</span>
                                    {selectedCategory && (
                                        <span className="ml-auto text-xs text-primary font-bold max-w-[100px] truncate">
                                            {getCategoryLabel()}
                                        </span>
                                    )}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-64 max-h-[300px] overflow-y-auto">
                                    <DropdownMenuRadioGroup value={selectedCategory?.toString() || 'all'} onValueChange={(val) => onCategoryChange(val === 'all' ? null : Number(val))}>
                                        <DropdownMenuRadioItem value="all" className="cursor-pointer">All Categories</DropdownMenuRadioItem>
                                        {categories.map((category) => (
                                            <DropdownMenuRadioItem key={category.id} value={category.id.toString()} className="cursor-pointer">
                                                {category.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Team Filter */}
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="py-3 cursor-pointer" disabled={!selectedSeason}>
                                    <Users className="mr-2 h-4 w-4" />
                                    <span>Team</span>
                                    {selectedTeam && (
                                        <span className="ml-auto text-xs text-primary font-bold max-w-[100px] truncate">
                                            {getTeamLabel()}
                                        </span>
                                    )}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-64 max-h-[300px] overflow-y-auto">
                                    <DropdownMenuRadioGroup value={selectedTeam || 'all'} onValueChange={(val) => onTeamChange(val === 'all' ? null : val)}>
                                        <DropdownMenuRadioItem value="all" className="cursor-pointer">All Teams</DropdownMenuRadioItem>
                                        {teams.map((team) => (
                                            <DropdownMenuRadioItem key={team.id} value={team.id.toString()} className="cursor-pointer">
                                                {team.label}
                                            </DropdownMenuRadioItem>
                                        ))}
                                    </DropdownMenuRadioGroup>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            {/* Mobile Clear Action inside dropdown */}
                             <div className="sm:hidden mt-2 pt-2 border-t border-border">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        onClearFilters();
                                        // Optional: Close dropdown logic if needed, but standard behavior usually fine
                                    }}
                                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={!hasActiveFilters}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Clear All Filters
                                </Button>
                             </div>

                        </DropdownMenuContent>
                    </DropdownMenu>
                 </div>
             </div>
        </div>
    );
}
