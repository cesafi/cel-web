'use client';

import { useState, useEffect } from 'react';
import { getMlbbStats, getValorantStats } from '@/actions/statistics';
import { StatisticsFilters } from '@/components/statistics/statistics-filters';
import { PlayerStatsTable } from '@/components/statistics/player-stats-table';
import { MlbbPlayerStats, ValorantPlayerStats } from '@/services/statistics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type GameType = 'mlbb' | 'valorant';

export function StatisticsContent() {
  const [game, setGame] = useState<GameType>('mlbb');
  const [mlbbStats, setMlbbStats] = useState<MlbbPlayerStats[]>([]);
  const [valorantStats, setValorantStats] = useState<ValorantPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<string>('kills_per_game');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const [mlbb, valorant] = await Promise.all([
          getMlbbStats(),
          getValorantStats()
        ]);
        
        if (mlbb.success && mlbb.data) setMlbbStats(mlbb.data);
        if (valorant.success && valorant.data) setValorantStats(valorant.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

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

  if (loading) {
    return <div className="animate-pulse">Loading statistics...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={game} onValueChange={(v) => setGame(v as GameType)}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="mlbb">Mobile Legends</TabsTrigger>
          <TabsTrigger value="valorant">Valorant</TabsTrigger>
        </TabsList>

        <TabsContent value="mlbb" className="mt-6">
          <PlayerStatsTable
            game="mlbb"
            data={sortData(mlbbStats)}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </TabsContent>

        <TabsContent value="valorant" className="mt-6">
          <PlayerStatsTable
            game="valorant"
            data={sortData(valorantStats)}
            sortColumn={sortColumn}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
