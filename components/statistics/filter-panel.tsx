'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Filter, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from '@/components/ui/dialog';
import { FilterOption } from '@/lib/types/stats-enhanced';

interface FilterPanelProps {
    seasons: FilterOption[];
    stages: FilterOption[];
    selectedSeason: number | null;
    selectedStage: number | null;
    onSeasonChange: (seasonId: number | null) => void;
    onStageChange: (stageId: number | null) => void;
    onClearFilters: () => void;
    isLoading?: boolean;
    className?: string;
}

export function FilterPanel({
    seasons,
    stages,
    selectedSeason,
    selectedStage,
    onSeasonChange,
    onStageChange,
    onClearFilters,
    isLoading = false,
    className,
}: FilterPanelProps) {
    const hasActiveFilters = selectedSeason !== null || selectedStage !== null;

    return (
        <div className={cn('w-full', className)}>
            {/* Desktop: Inline horizontal filter bar */}
            <div className="hidden md:flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">Filters</span>
                </div>

                {/* Season Filter */}
                <Select
                    value={selectedSeason?.toString() || 'all'}
                    onValueChange={(value) =>
                        onSeasonChange(value === 'all' ? null : parseInt(value))
                    }
                    disabled={isLoading}
                >
                    <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue placeholder="All Seasons" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Seasons</SelectItem>
                        {seasons.map((season) => (
                            <SelectItem key={season.id} value={season.id.toString()}>
                                {season.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Stage Filter (only if season selected) */}
                <Select
                    value={selectedStage?.toString() || 'all'}
                    onValueChange={(value) =>
                        onStageChange(value === 'all' ? null : parseInt(value))
                    }
                    disabled={isLoading || !selectedSeason}
                >
                    <SelectTrigger className="w-[200px] bg-background">
                        <SelectValue placeholder="All Stages" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {stages.map((stage) => (
                            <SelectItem key={stage.id} value={stage.id.toString()}>
                                {stage.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Clear
                    </Button>
                )}
            </div>

            {/* Mobile: Filter button with bottom sheet */}
            <div className="md:hidden">
                <Button
                    variant="outline"
                    className={cn(
                        'w-full justify-between',
                        hasActiveFilters && 'border-primary'
                    )}
                    onClick={() => {
                        // Mobile: Just show the simplified inline filters for now
                        // Could be extended to use a Sheet/Drawer component
                    }}
                >
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4" />
                        <span>Filters</span>
                        {hasActiveFilters && (
                            <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                                {[selectedSeason, selectedStage].filter(Boolean).length}
                            </span>
                        )}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                </Button>

                {/* Simplified mobile filters - always visible when button is clicked */}
                <div className="mt-3 space-y-3">
                    <Select
                        value={selectedSeason?.toString() || 'all'}
                        onValueChange={(value) =>
                            onSeasonChange(value === 'all' ? null : parseInt(value))
                        }
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="All Seasons" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Seasons</SelectItem>
                            {seasons.map((season) => (
                                <SelectItem key={season.id} value={season.id.toString()}>
                                    {season.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedStage?.toString() || 'all'}
                        onValueChange={(value) =>
                            onStageChange(value === 'all' ? null : parseInt(value))
                        }
                        disabled={isLoading || !selectedSeason}
                    >
                        <SelectTrigger className="w-full bg-background">
                            <SelectValue placeholder="All Stages" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Stages</SelectItem>
                            {stages.map((stage) => (
                                <SelectItem key={stage.id} value={stage.id.toString()}>
                                    {stage.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearFilters}
                            className="w-full"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Clear All Filters
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
