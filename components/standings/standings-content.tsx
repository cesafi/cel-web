'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CalendarDays, ChevronDown } from 'lucide-react';
import { moderniz } from '@/lib/fonts';
import SeasonSidebar from './season-sidebar';
import StandingsNavbar from './standings-navbar';
import GroupStageTable from './group-stage-table';
import BracketVisualization from './bracket-visualization';
import StandingsLoading from './standings-loading';
import {
  useStandings,
  useStandingsFilters,
  useAvailableSeasons,
  useAvailableSports,
  useAvailableCategories
} from '@/hooks/use-standings';
import { GroupStageStandings, BracketStandings, PlayinsStandings } from '@/lib/types/standings';

interface StandingsContentProps {
  readonly searchParams: {
    readonly season?: string;
    readonly sport?: string;
    readonly category?: string;
    readonly stage?: string;
  };
}

export default function StandingsContent({ searchParams: _ }: StandingsContentProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const filters = useStandingsFilters(urlSearchParams);

  const [selectedStage, setSelectedStage] = useState<number | undefined>(filters.stage_id);

  // Fetch data for default selection
  const { data: seasons } = useAvailableSeasons();
  const { data: sports } = useAvailableSports(filters.season_id ?? 0);
  const { data: categories } = useAvailableCategories(
    filters.season_id ?? 0,
    filters.sport_id ?? 0
  );

  // Fetch standings data
  const { data: standingsData, isLoading, error, refetch } = useStandings(filters);

  // Auto-select defaults when no filters are present
  useEffect(() => {
    const hasNoFilters = !filters.season_id && !filters.sport_id && !filters.esport_category_id;

    if (hasNoFilters && seasons?.length) {
      // Just select the default season first, then let subsequent effects handle sport/category
      const defaultSeason = seasons[0];

      const newParams = new URLSearchParams();
      newParams.set('season', defaultSeason.id.toString());
      newParams.set('sport', '1'); // Basketball (from mock data)
      newParams.set('category', '1'); // Men's College (from mock data)

      router.replace(`/standings?${newParams.toString()}`);
    }
  }, [seasons, filters, router]);

  // Update selected stage when filters change
  useEffect(() => {
    if (standingsData?.navigation.stages.length && !selectedStage) {
      const firstStage = standingsData.navigation.stages[0];
      setSelectedStage(firstStage.id);

      // Update URL with first stage
      const newParams = new URLSearchParams(urlSearchParams);
      newParams.set('stage', firstStage.id.toString());
      router.replace(`/standings?${newParams.toString()}`);
    }
  }, [standingsData, selectedStage, router, urlSearchParams]);

  // Handle stage change
  const handleStageChange = (stageId: number) => {
    setSelectedStage(stageId);

    // Update URL
    const newParams = new URLSearchParams(urlSearchParams);
    newParams.set('stage', stageId.toString());
    router.push(`/standings?${newParams.toString()}`);
  };

  // Handle season change
  const handleSeasonChange = (seasonId: number) => {
    const newParams = new URLSearchParams();
    newParams.set('season', seasonId.toString());
    newParams.set('sport', '1'); // Default to Basketball
    newParams.set('category', '1'); // Default to Men's College

    // Reset stage when season changes
    setSelectedStage(undefined);

    router.push(`/standings?${newParams.toString()}`);
  };

  // Handle sport change
  const handleSportChange = (sportId: number) => {
    const newParams = new URLSearchParams(urlSearchParams);
    newParams.set('sport', sportId.toString());
    newParams.set('category', '1'); // Reset to first category

    // Reset stage when sport changes
    setSelectedStage(undefined);

    router.push(`/standings?${newParams.toString()}`);
  };

  // Handle category change
  const handleCategoryChange = (categoryId: number) => {
    const newParams = new URLSearchParams(urlSearchParams);
    newParams.set('category', categoryId.toString());

    // Reset stage when category changes
    setSelectedStage(undefined);

    router.push(`/standings?${newParams.toString()}`);
  };

  // Show loading state
  if (isLoading) {
    return <StandingsLoading />;
  }

  // Show error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load standings data. Please try again.
          <button onClick={() => refetch()} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show layout even without complete data
  if (!standingsData) {
    return (
      <div className="flex h-[calc(100vh-8rem)]">
        {/* Season Sidebar */}
        <div className="w-64 flex-shrink-0 border-r">
          <div className="sticky top-6 p-4">
            <SeasonSidebar
              currentSeasonId={filters.season_id}
              onSeasonChange={handleSeasonChange}
            />
          </div>
        </div>

        {/* Main Content with Top Navbar */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Navbar */}
          <StandingsNavbar
            currentFilters={filters}
            onSportChange={handleSportChange}
            onCategoryChange={handleCategoryChange}
            onStageChange={handleStageChange}
            availableSports={sports}
            availableCategories={categories}
          />

          {/* Content Area */}
          <div className="flex-1 p-6">
            {filters.season_id && filters.sport_id && filters.esport_category_id ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Loading standings data...</p>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Select filters to view standings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Find current stage data
  const currentStage = standingsData.navigation.stages.find((s) => s.id === selectedStage);
  const isGroupStage = currentStage?.stage_type === 'round_robin';

  return (
    <div className="bg-background min-h-screen">

      {/* Main Content */}
       <div className="mt-8 mb-8 flex flex-col lg:flex-row min-h-[calc(100vh-20rem)]">
        {/* Mobile Season Selector */}
        <div className="lg:hidden px-4 mb-4">
          <div className="relative">
            <select
              value={filters.season_id ?? ''}
              onChange={(e) => handleSeasonChange(Number(e.target.value))}
              className="w-full appearance-none bg-card border border-border rounded-lg px-4 py-3 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {seasons?.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name || `Season ${season.id}`}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Season Sidebar - Desktop Only */}
        <div className="hidden lg:block w-64 flex-shrink-0 border-r">
          <div className="sticky top-6 p-4">
            <SeasonSidebar
              currentSeasonId={filters.season_id}
              onSeasonChange={handleSeasonChange}
            />
          </div>
        </div>

        {/* Main Content with Top Navbar */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top Navbar */}
          <StandingsNavbar
            currentFilters={filters}
            onSportChange={handleSportChange}
            onCategoryChange={handleCategoryChange}
            onStageChange={handleStageChange}
            navigation={standingsData.navigation}
            currentStage={selectedStage}
            availableSports={sports}
            availableCategories={categories}
          />

          {/* Content Area */}
          <div className="flex-1 p-4 lg:p-6 overflow-x-auto">
            <div className="mx-auto max-w-7xl">
              {(() => {
                if (isGroupStage) {
                  return (
                    <GroupStageTable
                      standings={standingsData.standings as GroupStageStandings}
                      loading={isLoading}
                    />
                  );
                }
                // Default to Bracket for single/double elimination
                return (
                  <BracketVisualization
                    standings={standingsData.standings as BracketStandings}
                    loading={isLoading}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
