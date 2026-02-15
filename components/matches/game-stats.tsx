'use client';

import { useState, useEffect } from 'react';
import { StatisticsService, MlbbPlayerStats, ValorantPlayerStats } from '@/services/statistics';
import { PlayerStatsTable } from '@/components/statistics/player-stats-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GameStatsProps {
  gameId: number;
  gameType: 'mlbb' | 'valorant';
  mapName?: string | null;
  duration?: string | null;
}

export function GameStats({ gameId, gameType, mapName, duration }: GameStatsProps) {
  const [stats, setStats] = useState<(MlbbPlayerStats | ValorantPlayerStats)[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string>('kills_per_game'); // Default, though for single game it's just 'total_kills' effectively
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function fetchGameStats() {
      setLoading(true);
      const result = await StatisticsService.getGameStats(gameId, gameType);
      
      if (result.success && result.data) {
        // Transform raw data to match table interface
        // Raw data is per-game, so "per_game" averages are just the values themselves
        const rawData = Array.isArray(result.data) ? result.data : [];
        const transformed = rawData.map((row: any) => ({
           player_id: row.player_id,
           player_ign: row.players?.ign || 'Unknown',
           player_photo_url: row.players?.photo_url,
           team_id: row.team_id,
           team_name: row.players?.schools_teams?.name || null,
           team_logo_url: row.players?.schools_teams?.logo_url || null,
           games_played: 1,
           
           // MLBB & Valorant common
           total_kills: row.kills,
           total_deaths: row.deaths,
           total_assists: row.assists,
           kills_per_game: row.kills,
           deaths_per_game: row.deaths,
           assists_per_game: row.assists,
           mvp_count: row.is_mvp ? 1 : 0,
           wins: 0, // Placeholder for interface compliance

           // MLBB specific
           hero_name: row.hero_name,
           total_gold: row.gold,
           avg_gpm: row.gpm || row.gold, // Assuming GPM stored or calculated? Table has GPM.
           total_damage_dealt: row.damage_dealt,
           total_turret_damage: row.turret_damage,

           // Valorant specific
           agent_name: row.agent_name,
           avg_acs: row.acs,
           avg_adr: row.adr,
           avg_hs_percent: row.headshot_percent,
           total_first_bloods: row.first_bloods,
           total_plants: row.plants || 0,
           total_defuses: row.defuses || 0
        }));
        setStats(transformed);
      }
      setLoading(false);
    }

    fetchGameStats();
  }, [gameId, gameType]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  const sortData = <T extends Record<string, any>>(data: T[]): T[] => {
    return [...data].sort((a, b) => {
      const aVal = a[sortColumn] ?? 0;
      const bVal = b[sortColumn] ?? 0;
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Loading game stats...</div>;

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Game Statistics</CardTitle>
        <div className="flex gap-2">
          {mapName && <Badge variant="outline">{mapName}</Badge>}
          {duration && <Badge variant="secondary">{duration}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No statistics recorded for this game.
          </div>
        ) : (
          <PlayerStatsTable 
            game={gameType} 
            data={sortData(stats)} 
            sortColumn={sortColumn} 
            sortOrder={sortOrder} 
            onSort={handleSort} 
          />
        )}
      </CardContent>
    </Card>
  );
}
