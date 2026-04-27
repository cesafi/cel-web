'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMlbbStats,
  getValorantStats,
  getHeroStats,
  getAgentStats,
  getMapStats,
  getTeamStats,
  getAvailableSeasons,
  getEsports,
} from '@/actions/statistics';
import type { EsportGame } from '@/actions/statistics';
import { EsportsSeasonStageWithDetails } from '@/lib/types/esports-seasons-stages';

import { StatisticsNavbar } from './statistics-navbar';
import { FilterPanel } from './filter-panel';
import { PlayerLeaderboard } from './player-leaderboard';
import { CharacterStatsTable } from './character-stats-table';
import { MapStatsDisplay } from './map-stats-display';
import { TeamRankings } from './team-rankings';
import { RoleMasteryTable } from './role-mastery-table';
import { StatisticsLoading } from './statistics-loading';
import { MlbbPlayerStats, ValorantPlayerStats } from '@/services/statistics';
import {
  StatisticsViewType,
  FilterOption,
  HeroStats,
  AgentStats,
  MapStats,
  TeamStats,
} from '@/lib/types/stats-enhanced';

type GameType = 'mlbb' | 'valorant';

interface StatisticsContentProps {
  availableStages?: EsportsSeasonStageWithDetails[];
}

export function StatisticsContent({ availableStages = [] }: StatisticsContentProps) {
  // State
  const [game, setGame] = useState<GameType>('mlbb');
  const [activeView, setActiveView] = useState<StatisticsViewType>('players');
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedDivision, setSelectedDivision] = useState<string>("Men's");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(100); // Show more items by default
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Data state
  const [mlbbStats, setMlbbStats] = useState<MlbbPlayerStats[]>([]);
  const [valorantStats, setValorantStats] = useState<ValorantPlayerStats[]>([]);
  const [heroStats, setHeroStats] = useState<HeroStats[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [mapStats, setMapStats] = useState<MapStats[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);

  // Filter data
  const [seasons, setSeasons] = useState<FilterOption[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [esportsData, setEsportsData] = useState<EsportGame[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string>('kills_per_game');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function fetchEsports() {
      const esportsResult = await getEsports();
      if (esportsResult.success && esportsResult.data) {
        setEsportsData(esportsResult.data);
      }
    }
    
    // Also fetch available active schools
    async function fetchSchools() {
       const { getPublicActiveSchools } = await import('@/actions/schools');
       const schoolsResponse = await getPublicActiveSchools();
       if (schoolsResponse.success && schoolsResponse.data) {
          setSchools(schoolsResponse.data);
       }
    }
    
    fetchEsports();
    fetchSchools();
  }, []);

  // Fetch seasons (independent of game)
  useEffect(() => {
    async function fetchSeasons() {
      const seasonsResult = await getAvailableSeasons();
      if (seasonsResult.success && seasonsResult.data) {
        const mappedSeasons = seasonsResult.data.map((s: any) => ({
          id: s.id,
          label: s.name || `Season ${s.id}`,
          value: s.id.toString(),
          start_at: s.start_at
        }));
        setSeasons(mappedSeasons);
        if (!selectedSeason && mappedSeasons.length > 0) {
          setSelectedSeason(mappedSeasons[0].id);
        }
      }
    }
    fetchSeasons();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute stages based on selected season and division
  const stages = useMemo(() => {
    if (!availableStages || availableStages.length === 0) return [];
    
    // Convert current GameType ('mlbb'/'valorant') to an esport_id check
    // by finding the corresponding EsportGame from esportsData
    const activeEsport = esportsData.find(
      e => e.abbreviation?.toLowerCase() === game || e.name.toLowerCase() === game
    );

    const filtered = availableStages.filter(stage => {
      // 1. Filter by season
      if (selectedSeason && stage.season_id !== selectedSeason) {
        return false;
      }
      
      // 2. Filter by division
      if (selectedDivision && selectedDivision !== 'all') {
         if (!stage.esports_categories || stage.esports_categories.division !== selectedDivision) {
           return false;
         }
      }
      
      // 3. Filter by esport (game)
      if (activeEsport) {
         if (!stage.esports_categories || stage.esports_categories.esport_id !== activeEsport.id) {
            return false;
         }
      }

      return true;
    });

    // We shouldn't strictly deduplicate by name across categories for StatisticsService
    // because getMlbbStats requires the exact `stage_id` for that particular category
    // Therefore, map exactly to their true ID
    return filtered.map(s => ({
       id: s.id,
       label: s.competition_stage
          ? s.competition_stage.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          : s.competition_stage,
       value: s.id.toString()
    }));
  }, [availableStages, selectedSeason, selectedDivision, game, esportsData]);

  useEffect(() => {
    if (selectedStage && !stages.find(s => parseInt(s.value) === selectedStage)) {
       setSelectedStage(null);
    }
  }, [stages, selectedStage]);

  // Handle Debounce for Search Query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset page when search term actually changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);


  // Fetch data conditionally based on current activeView
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (game === 'mlbb') {
        if (activeView === 'players') {
           const playerResult = await getMlbbStats({
             season_id: selectedSeason || undefined,
             stage_id: selectedStage || undefined,
             school_id: selectedSchool || undefined,
             division: selectedDivision || undefined,
             search_query: debouncedSearchQuery || undefined,
             page,
             limit
           });
           
           if (playerResult.success && playerResult.data) {
             setMlbbStats(playerResult.data);
             const resultWithCount = playerResult as any;
             if (resultWithCount.count) {
               setTotalItems(Math.max(resultWithCount.count || 0, 0));
               setTotalPages(Math.ceil((resultWithCount.count || 0) / limit));
             }
           }
        } 
        
        if (activeView === 'heroes') {
           const heroResult = await getHeroStats(selectedSeason || undefined, selectedStage || undefined, selectedDivision || undefined, selectedSchool || undefined);
           if (heroResult.success && heroResult.data) setHeroStats(heroResult.data as HeroStats[]);
        }
        
        if (activeView === 'teams') {
           const teamResult = await getTeamStats('mlbb', selectedSeason || undefined, selectedStage || undefined, selectedDivision || undefined);
           if (teamResult.success && teamResult.data) setTeamStats(teamResult.data as TeamStats[]);
        }
      } else {
        if (activeView === 'players') {
           const playerResult = await getValorantStats({
             season_id: selectedSeason || undefined,
             stage_id: selectedStage || undefined,
             school_id: selectedSchool || undefined,
             division: selectedDivision || undefined,
             search_query: debouncedSearchQuery || undefined,
             page,
             limit
           });
           if (playerResult.success && playerResult.data) {
             setValorantStats(playerResult.data);
             const resultWithCount = playerResult as any;
             if (resultWithCount.count) {
               setTotalItems(Math.max(resultWithCount.count || 0, 0));
               setTotalPages(Math.ceil((resultWithCount.count || 0) / limit));
             }
           }
        }
        
        if (activeView === 'agents') {
           const agentResult = await getAgentStats(selectedSeason || undefined, selectedStage || undefined, selectedDivision || undefined);
           if (agentResult.success && agentResult.data) setAgentStats(agentResult.data as AgentStats[]);
        }
        
        if (activeView === 'maps') {
           const mapResult = await getMapStats(selectedSeason || undefined, selectedStage || undefined);
           if (mapResult.success && mapResult.data) setMapStats(mapResult.data as MapStats[]);
        }
        
        if (activeView === 'teams') {
           const teamResult = await getTeamStats('valorant', selectedSeason || undefined, selectedStage || undefined, selectedDivision || undefined);
           if (teamResult.success && teamResult.data) setTeamStats(teamResult.data as TeamStats[]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [game, activeView, selectedSeason, selectedStage, selectedDivision, selectedSchool, debouncedSearchQuery, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle game change - reset filters and view
  const handleGameChange = (newGame: GameType) => {
    setGame(newGame);
    setSelectedDivision("Men's");
    setSelectedStage(null);
    setSelectedSchool(null);
    // Reset to players view if current view isn't available for new game
    if (activeView === 'heroes' && newGame === 'valorant') {
      setActiveView('agents');
    } else if ((activeView === 'agents' || activeView === 'maps') && newGame === 'mlbb') {
      setActiveView('heroes');
    }
  };

  // Handle sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  // Sort data helper
  const sortData = <T extends Record<string, any>>(data: T[]): T[] => {
    return [...data].sort((a, b) => {
      let aVal = a[sortColumn] ?? 0;
      let bVal = b[sortColumn] ?? 0;

      // Handle derived stats
      // Handle derived stats
      if (sortColumn === 'avg_kda') {
        // If avg_kda or kda_ratio is already present, use it
        if (typeof a.avg_kda === 'number') {
          aVal = a.avg_kda;
        } else if (typeof a.kda_ratio === 'number') {
          aVal = a.kda_ratio;
        } else {
          // Derived fallback
          const aK = Number(a.kills_per_game) || 0;
          const aA = Number(a.assists_per_game) || 0;
          const aD = Number(a.deaths_per_game) || 0;
          aVal = (aK + aA) / (aD || 1);
        }

        if (typeof b.avg_kda === 'number') {
          bVal = b.avg_kda;
        } else if (typeof b.kda_ratio === 'number') {
          bVal = b.kda_ratio;
        } else {
          const bK = Number(b.kills_per_game) || 0;
          const bA = Number(b.assists_per_game) || 0;
          const bD = Number(b.deaths_per_game) || 0;
          bVal = (bK + bA) / (bD || 1);
        }
      } else if (sortColumn === 'win_rate') {
        if (typeof a.win_rate === 'number') {
          aVal = a.win_rate;
        } else {
          aVal = (Number(a.wins) || 0) / (Number(a.games_played) || 1);
        }

        if (typeof b.win_rate === 'number') {
          bVal = b.win_rate;
        } else {
          bVal = (Number(b.wins) || 0) / (Number(b.games_played) || 1);
        }
      }

      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedSeason(null);
    setSelectedStage(null);
    setSelectedDivision("Men's");
    setSelectedSchool(null);
    setSearchQuery('');
    setDebouncedSearchQuery('');
  };

  // Get current player data based on game
  const playerData = game === 'mlbb' ? mlbbStats : valorantStats;

  // Render current view
  const renderView = () => {
    if (loading) {
      return <StatisticsLoading />;
    }

    // Local filtering for non-paginated stats
    const filterLocal = <T extends Record<string, any>>(data: T[]): T[] => {
      if (!debouncedSearchQuery) return data;
      const lower = debouncedSearchQuery.toLowerCase();
      return data.filter(item => {
        return Object.values(item).some(val =>
          typeof val === 'string' && val.toLowerCase().includes(lower)
        );
      });
    };

    switch (activeView) {
      case 'players':
        return (
          <PlayerLeaderboard
            game={game}
            data={sortData(playerData as (MlbbPlayerStats | ValorantPlayerStats)[])}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
            isLoading={loading}
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={limit}
            onPageChange={setPage}
            onItemsPerPageChange={setLimit}
          />
        );
      case 'heroes':
        return (
          <CharacterStatsTable
            game="mlbb"
            data={sortData(filterLocal(heroStats))}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        );
      case 'agents':
        return (
          <CharacterStatsTable
            game="valorant"
            data={sortData(filterLocal(agentStats))}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        );
      case 'maps':
        return <MapStatsDisplay data={filterLocal(mapStats)} />;
      case 'teams':
        return (
          <TeamRankings
            game={game}
            data={sortData(filterLocal(teamStats))}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        );
      case 'role-mastery':
        return (
          <RoleMasteryTable
            game={game}
            seasonId={selectedSeason}
            stageId={selectedStage}
            division={selectedDivision}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Navigation */}


      {/* Filters */}
      <FilterPanel
        seasons={seasons}
        stages={stages}
        availableSchools={schools}
        selectedSeason={selectedSeason}
        selectedStage={selectedStage}
        selectedDivision={selectedDivision}
        selectedSchool={selectedSchool}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSeasonChange={setSelectedSeason}
        onStageChange={setSelectedStage}
        onDivisionChange={setSelectedDivision}
        onSchoolChange={setSelectedSchool}
        onClearFilters={handleClearFilters}
        isLoading={loading}
        game={game}
        onGameChange={handleGameChange}
        esportsData={esportsData}
      />

      <StatisticsNavbar
        game={game}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Content */}
      <div className="mt-6">
        {renderView()}
      </div>
    </div>
  );
}
