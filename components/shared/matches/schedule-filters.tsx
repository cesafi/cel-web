'use client';

import { useState } from 'react';
import { ScheduleFilters } from '@/lib/types/matches';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';

interface ScheduleFiltersProps {
  readonly filters: ScheduleFilters;
  readonly onFiltersChange: (filters: ScheduleFilters) => void;
  readonly onClearFilters: () => void;
  readonly className?: string;
}

export function ScheduleFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  className
}: ScheduleFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof ScheduleFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined && value !== '' && value !== null
  );

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== '' && value !== null
  ).length;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
            {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search matches..."
              value={filters.search ?? ''}
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status ?? ''}
              onValueChange={(value) => updateFilter('status', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="finished">Finished</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_from">From Date</Label>
              <Input
                id="date_from"
                type="date"
                value={filters.date_from ?? ''}
                onChange={(e) => updateFilter('date_from', e.target.value || undefined)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_to">To Date</Label>
              <Input
                id="date_to"
                type="date"
                value={filters.date_to ?? ''}
                onChange={(e) => updateFilter('date_to', e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Sport */}
          <div className="space-y-2">
            <Label htmlFor="sport_id">Sport</Label>
            <Select
              value={filters.sport_id?.toString() ?? ''}
              onValueChange={(value) =>
                updateFilter('sport_id', value ? parseInt(value) : undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All sports</SelectItem>
                <SelectItem value="1">Basketball</SelectItem>
                <SelectItem value="2">Volleyball</SelectItem>
                <SelectItem value="3">Football</SelectItem>
                <SelectItem value="4">Track & Field</SelectItem>
                <SelectItem value="5">Swimming</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <Label>Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {filters.search}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter('search', undefined)}
                    />
                  </Badge>
                )}
                {filters.status && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Status: {filters.status}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter('status', undefined)}
                    />
                  </Badge>
                )}
                {filters.date_from && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    From: {filters.date_from}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter('date_from', undefined)}
                    />
                  </Badge>
                )}
                {filters.date_to && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    To: {filters.date_to}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter('date_to', undefined)}
                    />
                  </Badge>
                )}
                {filters.sport_id && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Sport: {filters.sport_id}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => updateFilter('sport_id', undefined)}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
