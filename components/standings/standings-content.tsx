'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CalendarDays, ChevronDown } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
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
import { GroupStageStandings, BracketStandings, PlayinsStandings, StandingsFilters } from '@/lib/types/standings';

interface StandingsContentProps {
  readonly searchParams: {
    readonly season?: string;
    readonly sport?: string;
    readonly category?: string;
    readonly stage?: string;
  };
  readonly initialFilters?: StandingsFilters;
}

import { toSlug, normalizeStageSlug } from '@/lib/slug-utils';

export default function StandingsContent({ searchParams: _, initialFilters }: StandingsContentProps) {
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  // Use initialFilters if available (server-side resolve), otherwise fall back to searchParams
  const queryFilters = useStandingsFilters(urlSearchParams);
  const filters = initialFilters || queryFilters;

  const [selectedStage, setSelectedStage] = useState<number | undefined>(filters.stage_id);

  // Fetch data for default selection
  const { data: seasons } = useAvailableSeasons();
  const { data: sports } = useAvailableSports(filters.season_id ?? 0);
  const { data: categories } = useAvailableCategories(
    filters.season_id ?? 0,
    filters.sport_id ?? 0
  );

  // Fetch standings data
  const { data: standingsData, isLoading, error, refetch, isFetching } = useStandings(filters);

  // Detect if we're in the initial loading phase (no data yet, still resolving defaults)
  const isInitialLoading = useMemo(() => {
    const hasNoFilters = !filters.season_id && !filters.sport_id && !filters.esport_category_id;
    const isResolvingDefaults = hasNoFilters && (!seasons || seasons.length === 0);
    const isWaitingForData = (isLoading || isFetching) && !standingsData;
    const filtersIncomplete = !filters.season_id || !filters.sport_id || !filters.esport_category_id;
    return isResolvingDefaults || isWaitingForData || (filtersIncomplete && !standingsData && !error);
  }, [filters, seasons, isLoading, isFetching, standingsData, error]);

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



  // Update selected stage when filters change or data loads
  useEffect(() => {
    if (standingsData?.navigation.stages.length && !selectedStage) {
      // If we have stages but none selected (and no stage in URL filter), select the first one.
      const firstStage = standingsData.navigation.stages[0];
      
      // We only auto-select locally for UI state. 
      // If we want to reflect in URL, we would push. But for "viewing", local state is fine.
      // However, if the user navigates deep, the URL includes stage. 
      // If they don't, we show first stage but maybe don't force URL change to avoid redirect loops?
      // Let's set local only.
      setSelectedStage(firstStage.id);
    } else if (filters.stage_id) {
       // If filter has stage, sync local state
       setSelectedStage(filters.stage_id);
    }
  }, [standingsData, selectedStage, filters.stage_id]);

  // Auto-select SPORT when season changes or current sport is invalid
  useEffect(() => {
    if (filters.season_id && sports && sports.length > 0) {
      const currentSportValid = sports.some(s => s.id === filters.sport_id);
      
      if (!filters.sport_id || !currentSportValid) {
         const first = sports[0];
         // Construct path with new sport
         const season = seasons?.find(s => s.id === filters.season_id);
         if (season) {
             router.replace(`/standings/${toSlug(season.name || '')}/${toSlug(first.abbreviation || first.name)}`);
         }
      }
    }
  }, [sports, filters.season_id, filters.sport_id, seasons, router]);

  // Auto-select category when sport changes or current category is invalid
  useEffect(() => {
    if (filters.sport_id && categories && categories.length > 0) {
      const currentCategoryValid = categories.some(c => c.id === filters.esport_category_id);
      
      if (!filters.esport_category_id || !currentCategoryValid) {
         const first = categories[0];
         // Construct path with new category
         const season = seasons?.find(s => s.id === filters.season_id);
         const sport = sports?.find(s => s.id === filters.sport_id);
         
         if (season && sport) {
             router.replace(`/standings/${toSlug(season.name || '')}/${toSlug(sport.abbreviation || sport.name)}/${toSlug(first.display_name || '')}`);
         }
      }
    }
  }, [categories, filters.sport_id, filters.esport_category_id, filters.season_id, seasons, sports, router]);

  // constructSlugPath helper
  const constructSlugPath = (
    seasonId?: number, 
    sportId?: number, 
    categoryId?: number, 
    stageId?: number
  ) => {
    // Helper to find item by ID
    const season = seasons?.find(s => s.id === (seasonId || filters.season_id));
    const sport = sports?.find(s => s.id === (sportId || filters.sport_id));
    const category = categories?.find(c => c.id === (categoryId || filters.esport_category_id));
    const stage = standingsData?.navigation.stages.find(s => s.id === (stageId || selectedStage || filters.stage_id));
    
    if (!season) return '/standings';
    
    let path = `/standings/${toSlug(season.name || '')}`;
    
    if (sport) {
        path += `/${toSlug(sport.abbreviation || sport.name)}`;
        
        if (category) {
            path += `/${toSlug(category.display_name || '')}`;
            
            if (stage) {
                // Special handling for stage names which might be "Groupstage" in DB but "group-stage" in URL
                const stageName = stage.competition_stage === 'group_stage' ? 'group-stage' : stage.competition_stage;
                path += `/${toSlug(stageName)}`;
            }
        }
    }
    
    return path;
  };

  // Handle stage change
  const handleStageChange = (stageId: number) => {
    setSelectedStage(stageId);
    
    startTransition(() => {
        const path = constructSlugPath(undefined, undefined, undefined, stageId);
        router.push(path, { scroll: false });
    });
  };

  // Handle season change
  const handleSeasonChange = (seasonId: number) => {
     // Find the new season to construct path base
     const season = seasons?.find(s => s.id === seasonId);
     if (season) {
         // Just navigate to the season root, let defaults handle the rest via auto-select if we want, 
         // OR we can try to be smart. For now, cascading login in useEffect will mostly handle "missing" parts if we land on defaults.
         // BUT, we want to clear the downstream.
         router.push(`/standings/${toSlug(season.name || '')}`);
     }
  };

  // Handle sport change
  const handleSportChange = (sportId: number) => {
    // When sport changes, we clear category (and stage)
    const path = constructSlugPath(undefined, sportId, undefined, undefined).split('/').slice(0, 4).join('/'); 
    // ^ Hacky way to ensure we stop at sport? 
    // Better: constructSlugPath(undefined, sportId, -1, -1) but -1 isn't valid.
    // Let's just build it manually for clarity:
    const season = seasons?.find(s => s.id === filters.season_id);
    const sport = sports?.find(s => s.id === sportId);
    if (season && sport) {
        router.push(`/standings/${toSlug(season.name || '')}/${toSlug(sport.abbreviation || sport.name)}`);
    }
    
    setSelectedStage(undefined);
  };

  // Handle category change
  const handleCategoryChange = (categoryId: number) => {
    // When category changes, we clear stage
    const season = seasons?.find(s => s.id === filters.season_id);
    const sport = sports?.find(s => s.id === filters.sport_id);
    const category = categories?.find(c => c.id === categoryId);
    
    if (season && sport && category) {
        router.push(`/standings/${toSlug(season.name || '')}/${toSlug(sport.abbreviation || sport.name)}/${toSlug(category.display_name || '')}`);
    }
    
    setSelectedStage(undefined);
  };

  // Determine content to render
  const renderContent = () => {
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

    if (isLoading && !standingsData) {
        return <StandingsLoading />;
    }

    if (!standingsData) {
        return (
          <div className="py-8 text-center min-h-[500px] flex flex-col items-center justify-center">
             {isFetching ? (
                <StandingsLoading className="min-h-0 bg-transparent w-full" />
             ) : (
                <p className="text-muted-foreground">Select filters to view standings</p>
             )}
          </div>
        );
    }

    // Find current stage data for rendering (only if we have data)
    const currentStage = standingsData.navigation.stages.find((s) => s.id === selectedStage);
    const isGroupStage = currentStage?.stage_type === 'round_robin';
    
    // Calculate loading state for transitions
    const isDataStale = selectedStage !== filters.stage_id && filters.stage_id !== undefined;
    const isLoadingState = isPending || isFetching || isDataStale;

    return (
        <div className="flex-1 pt-6 overflow-hidden relative">
             {/* Loading Overlay for Transitions */}
             {isLoadingState && (
                <div className="absolute inset-0 z-50 bg-background/50 backdrop-blur-[1px] flex items-center justify-center transition-all duration-300">
                    <div className="bg-background/80 p-4 rounded-full shadow-lg border">
                         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </div>
             )}

            {isGroupStage ? (
               <GroupStageTable
                  standings={standingsData.standings as GroupStageStandings}
                  loading={isLoadingState}
               />
            ) : (
               <BracketVisualization 
                  standings={standingsData.standings as BracketStandings}
                  loading={isLoadingState}
               />
            )}
        </div>
    );
  };

  return (
    <div className="bg-background min-h-screen relative">
      {/* Initial Loading Overlay */}
      {isInitialLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <StandingsLoading className="min-h-0 bg-transparent" />
        </div>
      )}

      {/* Hero Section - Always Visible */}
      <section className="from-primary/10 via-background to-secondary/10 relative bg-gradient-to-br pt-20 pb-8 sm:pt-24 sm:pb-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzM2YzYxIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Main Heading */}
              <h1
                className={`${moderniz.className} text-foreground mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl md:text-6xl lg:text-7xl`}
              >
                League <span className="text-gradient-cel">Standings</span>
              </h1>

              {/* Subtitle */}
              <p
                className={`${roboto.className} text-muted-foreground mx-auto mb-8 max-w-3xl text-base leading-relaxed sm:mb-12 sm:text-lg md:text-xl`}
              >
                Stay updated with the latest rankings, team performance, and tournament progress across all CESAFI esports.
              </p>
            </div>
          </div>
      </section>

      {/* Main Content Layout */}
       <div className="mt-4 sm:mt-8 mb-8 flex flex-col lg:flex-row min-h-[calc(100vh-20rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Season Selector */}
        <div className="lg:hidden mb-4">
          <div className="relative">
            <select
              className="w-full appearance-none rounded-md border border-input bg-background px-3 py-2 h-9 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={filters.season_id || ''}
              onChange={(e) => handleSeasonChange(Number(e.target.value))}
            >
              <option value="" disabled>Select Season</option>
              {seasons?.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.name || `Season ${season.id}`}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Season Sidebar - Desktop Only */}
        <div className="hidden lg:block w-64 flex-shrink-0 border-r pr-6">
          <div className="sticky top-6">
            <SeasonSidebar
              currentSeasonId={filters.season_id}
              onSeasonChange={handleSeasonChange}
            />
          </div>
        </div>

        {/* Main Content with Top Navbar */}
        <div className="flex min-w-0 flex-1 flex-col pl-0 lg:pl-6">
          {/* Top Navbar */}
          <StandingsNavbar
            currentFilters={filters}
            onSportChange={handleSportChange}
            onCategoryChange={handleCategoryChange}
            onStageChange={handleStageChange}
            navigation={standingsData?.navigation}
            currentStage={selectedStage}
            availableSports={sports}
            availableCategories={categories}
          />

          {/* Visualization Area */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
