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
  getStagesBySeason,
} from '@/actions/statistics';
import { GameModeSelector } from './game-mode-selector';
import { StatisticsNavbar } from './statistics-navbar';
import { FilterPanel } from './filter-panel';
import { PlayerLeaderboard } from './player-leaderboard';
import { HeroStatsGrid } from './hero-stats-grid';
import { AgentStatsGrid } from './agent-stats-grid';
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

  // UI state
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string>('kills_per_game');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch filter options
  useEffect(() => {
    async function fetchFilters() {
      const seasonsResult = await getAvailableSeasons();
      if (seasonsResult.success && seasonsResult.data) {
        setSeasons(seasonsResult.data as FilterOption[]);
      }
    }
    fetchFilters();
  }, []);

  // Fetch stages when season changes
  useEffect(() => {
    async function fetchStages() {
      if (selectedSeason) {
        const stagesResult = await getStagesBySeason(selectedSeason);
        if (stagesResult.success && stagesResult.data) {
          setStages(stagesResult.data as FilterOption[]);
        }
      } else {
        setStages([]);
        setSelectedStage(null);
      }
    }
    fetchStages();
  }, [selectedSeason]);

  // Fetch data based on current game and view
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch player stats for the current game
      if (game === 'mlbb') {
        const [playerResult, heroResult, teamResult] = await Promise.all([
          getMlbbStats(),
          getHeroStats(selectedSeason || undefined, selectedStage || undefined),
          getTeamStats('mlbb', selectedSeason || undefined, selectedStage || undefined),
        ]);

        if (playerResult.success && playerResult.data) setMlbbStats(playerResult.data);
        if (heroResult.success && heroResult.data) setHeroStats(heroResult.data as HeroStats[]);
        if (teamResult.success && teamResult.data) setTeamStats(teamResult.data as TeamStats[]);
      } else {
        const [playerResult, agentResult, mapResult, teamResult] = await Promise.all([
          getValorantStats(),
          getAgentStats(selectedSeason || undefined, selectedStage || undefined),
          getMapStats(selectedSeason || undefined, selectedStage || undefined),
          getTeamStats('valorant', selectedSeason || undefined, selectedStage || undefined),
        ]);

        if (playerResult.success && playerResult.data) setValorantStats(playerResult.data);
        if (agentResult.success && agentResult.data) setAgentStats(agentResult.data as AgentStats[]);
        if (mapResult.success && mapResult.data) setMapStats(mapResult.data as MapStats[]);
        if (teamResult.success && teamResult.data) setTeamStats(teamResult.data as TeamStats[]);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  }, [game, selectedSeason, selectedStage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle game change - reset view if needed
  const handleGameChange = (newGame: GameType) => {
    setGame(newGame);
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
      const aVal = a[sortColumn] ?? 0;
      const bVal = b[sortColumn] ?? 0;
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedSeason(null);
    setSelectedStage(null);
  };

  // Get current player data based on game
  const playerData = game === 'mlbb' ? mlbbStats : valorantStats;

  // Render current view
  const renderView = () => {
    if (loading) {
      return <StatisticsLoading />;
    }

    switch (activeView) {
      case 'players':
        return (
          <PlayerLeaderboard
            game={game}
            data={sortData(playerData)}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        );
      case 'heroes':
        return <HeroStatsGrid data={heroStats} />;
      case 'agents':
        return <AgentStatsGrid data={agentStats} />;
      case 'maps':
        return <MapStatsDisplay data={mapStats} />;
      case 'teams':
        return <TeamRankings game={game} data={teamStats} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Game Mode Selector */}
      <GameModeSelector game={game} onGameChange={handleGameChange} />

      {/* Statistics Navigation */}
      <StatisticsNavbar
        game={game}
        activeView={activeView}
        onViewChange={setActiveView}
      />

      {/* Filters */}
      <FilterPanel
        seasons={seasons}
        stages={stages}
        selectedSeason={selectedSeason}
        selectedStage={selectedStage}
        onSeasonChange={setSelectedSeason}
        onStageChange={setSelectedStage}
        onClearFilters={handleClearFilters}
        isLoading={loading}
      />

      {/* Content */}
      <div className="mt-6">
        {renderView()}
      </div>
    </div>
  );
}
