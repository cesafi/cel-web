'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getMlbbStats,
  getValorantStats,
  getHeroStats,
  getAgentStats,
  getMapStats,
  getTeamStats,
  getAvailableSeasons,
  getAvailableCategories,
  getStagesBySeason,
  getEsports,
} from '@/actions/statistics';
import type { EsportGame } from '@/actions/statistics';

import { StatisticsNavbar } from './statistics-navbar';
import { FilterPanel } from './filter-panel';
import { PlayerLeaderboard } from './player-leaderboard';
import { CharacterStatsTable } from './character-stats-table';
import { MapStatsDisplay } from './map-stats-display';
import { TeamRankings } from './team-rankings';
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

export function StatisticsContent() {
  // State
  const [game, setGame] = useState<GameType>('mlbb');
  const [activeView, setActiveView] = useState<StatisticsViewType>('players');
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
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
  const [stages, setStages] = useState<FilterOption[]>([]);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [teams, setTeams] = useState<FilterOption[]>([]);
  const [esportsData, setEsportsData] = useState<EsportGame[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string>('kills_per_game');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch esports data first (needed to map game -> esport_id)
  useEffect(() => {
    async function fetchEsports() {
      const esportsResult = await getEsports();
      if (esportsResult.success && esportsResult.data) {
        setEsportsData(esportsResult.data);
      }
    }
    fetchEsports();
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

  // Fetch categories when game or esportsData changes
  useEffect(() => {
    async function fetchCategories() {
      // Find the esport_id for the current game
      const esport = esportsData.find(e => {
        const name = e.name.toLowerCase();
        if (game === 'mlbb') return name.includes('mobile legends') || name.includes('mlbb');
        if (game === 'valorant') return name.includes('valorant');
        return false;
      });

      const categoriesResult = await getAvailableCategories(esport?.id);
      if (categoriesResult.success && categoriesResult.data) {
        const mappedCategories = categoriesResult.data.map((c: any) => ({
          id: c.id,
          label: c.name || `${c.division} - ${c.levels}`,
          value: c.id.toString()
        }));
        setCategories(mappedCategories);
      } else {
        setCategories([]);
      }
    }

    if (esportsData.length > 0) {
      fetchCategories();
    }
  }, [game, esportsData]);

  // Fetch stages when season or category changes
  useEffect(() => {
    async function fetchStages() {
      if (selectedSeason && selectedCategory) {
        const stagesResult = await getStagesBySeason(selectedSeason, selectedCategory);
        if (stagesResult.success && stagesResult.data) {
          const mappedStages = stagesResult.data.map((s: any) => ({
            id: s.id,
            label: s.competition_stage
              ? s.competition_stage.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
              : s.label,
            value: s.id.toString()
          }));
          setStages(mappedStages);
        }
      } else {
        setStages([]);
        setSelectedStage(null);
      }
    }
    fetchStages();
  }, [selectedSeason, selectedCategory]);

  // Fetch teams when season, game, or category changes
  useEffect(() => {
    async function fetchTeams() {
      if (!selectedSeason) {
        setTeams([]);
        return;
      }

      const result = await getTeamStats(game, selectedSeason, undefined, selectedCategory || undefined);
      if (result.success && result.data) {
        // Find category label for prefix
        const categoryLabel = selectedCategory
          ? categories.find(c => c.id === selectedCategory)?.label
          : null;

        const mappedTeams = result.data.map((t: any) => ({
          id: t.team_id,
          label: categoryLabel ? `${categoryLabel} - ${t.team_name}` : t.team_name,
          value: t.team_id
        }));

        // Deduplicate and sort alphabetically
        const uniqueTeams = Array.from(new Map(mappedTeams.map((t: any) => [t.value, t])).values());
        const sortedTeams = (uniqueTeams as FilterOption[]).sort((a, b) =>
          a.label.localeCompare(b.label)
        );
        setTeams(sortedTeams);
      }
    }
    fetchTeams();
  }, [selectedSeason, game, selectedCategory, categories]);

  // Handle Debounce for Search Query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset page when search term actually changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);


  // Fetch data based on current game and view
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch player stats for the current game
      if (game === 'mlbb') {
        const [playerResult, heroResult, teamResult] = await Promise.all([
          getMlbbStats({
            season_id: selectedSeason || undefined,
            stage_id: selectedStage || undefined,
            team_id: selectedTeam || undefined,
            category_id: selectedCategory || undefined,
            search_query: debouncedSearchQuery || undefined,
            page,
            limit
          }),
          getHeroStats(selectedSeason || undefined, selectedStage || undefined),
          getTeamStats('mlbb', selectedSeason || undefined, selectedStage || undefined, selectedCategory || undefined),
        ]);

        if (playerResult.success && playerResult.data) {
          setMlbbStats(playerResult.data);
          // @ts-ignore - count comes from modified service return
          const resultWithCount = playerResult as any;
          if (resultWithCount.count) {
            setTotalItems(Math.max(resultWithCount.count || 0, 0));
            setTotalPages(Math.ceil((resultWithCount.count || 0) / limit));
          }
        }
        if (heroResult.success && heroResult.data) setHeroStats(heroResult.data as HeroStats[]);
        if (teamResult.success && teamResult.data) setTeamStats(teamResult.data as TeamStats[]);
      } else {
        const [playerResult, agentResult, mapResult, teamResult] = await Promise.all([
          getValorantStats({
            season_id: selectedSeason || undefined,
            stage_id: selectedStage || undefined,
            team_id: selectedTeam || undefined,
            category_id: selectedCategory || undefined,
            search_query: debouncedSearchQuery || undefined,
            page,
            limit
          }),
          getAgentStats(selectedSeason || undefined, selectedStage || undefined),
          getMapStats(selectedSeason || undefined, selectedStage || undefined),
          getTeamStats('valorant', selectedSeason || undefined, selectedStage || undefined, selectedCategory || undefined),
        ]);

        if (playerResult.success && playerResult.data) {
          setValorantStats(playerResult.data);
          // @ts-ignore - count comes from modified service return
          const resultWithCount = playerResult as any;
          if (resultWithCount.count) {
            setTotalItems(Math.max(resultWithCount.count || 0, 0));
            setTotalPages(Math.ceil((resultWithCount.count || 0) / limit));
          }
        }
        if (agentResult.success && agentResult.data) setAgentStats(agentResult.data as AgentStats[]);
        if (mapResult.success && mapResult.data) setMapStats(mapResult.data as MapStats[]);
        if (teamResult.success && teamResult.data) setTeamStats(teamResult.data as TeamStats[]);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [game, selectedSeason, selectedStage, selectedCategory, selectedTeam, debouncedSearchQuery, page, limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle game change - reset filters and view
  const handleGameChange = (newGame: GameType) => {
    setGame(newGame);
    setSelectedCategory(null);
    setSelectedStage(null);
    setSelectedTeam(null);
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
    setSelectedCategory(null);
    setSelectedTeam(null);
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
        categories={categories}
        teams={teams}
        selectedSeason={selectedSeason}
        selectedStage={selectedStage}
        selectedCategory={selectedCategory}
        selectedTeam={selectedTeam}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSeasonChange={setSelectedSeason}
        onStageChange={setSelectedStage}
        onCategoryChange={setSelectedCategory}
        onTeamChange={setSelectedTeam}
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
