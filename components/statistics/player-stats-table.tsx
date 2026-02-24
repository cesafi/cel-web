'use client';

import { MlbbPlayerStats, ValorantPlayerStats } from '@/services/statistics';
import { GenericStatsTable, StatsColumn } from './generic-stats-table';
import { Trophy } from 'lucide-react';
import Image from 'next/image';

interface PlayerStatsTableProps {
  game: 'mlbb' | 'valorant';
  data: (MlbbPlayerStats | ValorantPlayerStats)[];
  sortColumn: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function PlayerStatsTable({
  game,
  data,
  sortColumn,
  sortOrder,
  onSort
}: PlayerStatsTableProps) {

  const formatStats = (val: number, isPercent = false) => {
    if (val === undefined || val === null) return '-';
    // Small check for values that are logically integers (like MVP count) vs averages
    return isPercent ? val.toFixed(1) + '%' : val % 1 === 0 ? val.toLocaleString() : val.toFixed(1);
  };
  const formatLarge = (val: number) => {
    if (val > 1000) return (val / 1000).toFixed(1) + 'k';
    return Math.round(val).toLocaleString();
  };

  const identityColumn: StatsColumn<any> = {
    key: 'player_ign',
    label: 'Player Identity',
    width: 'min-w-[200px] w-[200px] md:min-w-[280px] md:w-[280px]',
    sortable: true,
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 relative rounded-full overflow-hidden bg-muted flex-shrink-0 border border-border/50">
          {row.player_photo_url ? (
            <Image 
                src={row.player_photo_url} 
                alt={row.player_ign} 
                fill
                className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-muted-foreground text-xs">
                {row.player_ign.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
             <div className="font-bold text-sm tracking-tight text-foreground">{row.player_ign}</div>
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                 {row.team_logo_url && <img src={row.team_logo_url} className="w-3 h-3 rounded-full opacity-70" alt="" />}
                 <span className="hidden sm:inline-block truncate max-w-[130px] md:max-w-none w-full" title={row.team_name}>{row.team_name}</span>
             </div>
        </div>
      </div>
    )
  };

  // Helper to get hero/agent icon
  const characterColumn: StatsColumn<any> = {
    key: game === 'mlbb' ? 'hero_name' : 'agent_name',
    label: game === 'mlbb' ? 'Hero' : 'Agent',
    width: 'min-w-[100px]',
    align: 'center',
    sortable: true,
    // We assume backend might eventually return hero icon url in player stats or we deduce it
    // For now just text or if URL exists
    render: (row) => (
         <div className="flex justify-center flex-col items-center">
             <span className="text-xs font-medium">{game === 'mlbb' ? row.hero_name : row.agent_name || '-'}</span>
         </div>
    )
  };

  const mlbbColumns: StatsColumn<MlbbPlayerStats>[] = [
    identityColumn,
    // characterColumn, // Optional, maybe clutter (commented out)
    { key: 'games_played', label: 'G', tooltip: 'Games Played', useHeatmap: true, align: 'center', width: 'min-w-[60px]', formatter: (v: number) => v },
    { key: 'win_rate', label: 'WR%', tooltip: 'Win Rate %', useHeatmap: true, align: 'center', width: 'min-w-[70px]', formatter: (v, r) => {
        // Calculate dynamic win rate if not present or just trust backend
        const wr = r.games_played > 0 ? (r.wins / r.games_played) * 100 : 0;
        return <span className={wr >= 50 ? "text-emerald-500 font-bold" : "text-red-400"}>{wr.toFixed(0)}%</span>
    } },
    { key: 'avg_rating', label: 'RTG', tooltip: 'Average Rating', useHeatmap: true, align: 'center', width: 'min-w-[70px]', formatter: (v: number) => v.toFixed(1) },
    { key: 'mvp_count', label: 'MVP', tooltip: 'Total MVPs', useHeatmap: true, align: 'center', width: 'min-w-[60px]' },
    { key: 'kills_per_game', label: 'K', tooltip: 'Kills per Game', useHeatmap: true, align: 'center', width: 'min-w-[60px]', formatter: (v: number) => <span className="font-bold">{v.toFixed(1)}</span> },
    { key: 'deaths_per_game', label: 'D', tooltip: 'Deaths per Game', useHeatmap: true, invertHeatmap: true, align: 'center', width: 'min-w-[60px]', formatter: (v: number) => v.toFixed(1) },
    { key: 'assists_per_game', label: 'A', tooltip: 'Assists per Game', useHeatmap: true, align: 'center', width: 'min-w-[60px]', formatter: (v: number) => v.toFixed(1) },
    { key: 'avg_kda', label: 'KDA', tooltip: 'KDA Ratio', useHeatmap: true, align: 'center', width: 'min-w-[70px]', render: (r) => {
        const kda = (r.total_kills + r.total_assists) / (r.total_deaths || 1);
        return kda.toFixed(2);
    }},
    { key: 'avg_gpm', label: 'GPM', tooltip: 'Gold per Minute', useHeatmap: true, align: 'center', width: 'min-w-[90px]', formatter: (v: number) => Math.round(v).toLocaleString() },
    { key: 'total_damage_dealt', label: 'DMG', tooltip: 'Total Damage (k)', useHeatmap: true, align: 'center', width: 'min-w-[90px]', formatter: (v: number) => formatLarge(v) },
    { key: 'total_turret_damage', label: 'TUR', tooltip: 'Turret Damage (k)', useHeatmap: true, align: 'center', width: 'min-w-[90px]', formatter: (v: number) => formatLarge(v) },
    { key: 'total_lord_slain', label: 'LRD', tooltip: 'Lords Slain', useHeatmap: true, align: 'center', width: 'min-w-[60px]' },
    { key: 'total_turtle_slain', label: 'TRT', tooltip: 'Turtles Slain', useHeatmap: true, align: 'center', width: 'min-w-[60px]' },
    { key: 'avg_teamfight_percent', label: 'TF%', tooltip: 'Teamfight Participation', useHeatmap: true, align: 'center', width: 'min-w-[80px]', formatter: (v: number) => (v * 100).toFixed(1) + '%' },
  ];

  const valorantColumns: StatsColumn<ValorantPlayerStats>[] = [
    identityColumn,
    // characterColumn,
    { key: 'games_played', label: 'G', tooltip: 'Games Played', useHeatmap: true, align: 'center', width: 'min-w-[60px]' },
    { key: 'win_rate', label: 'WR%', tooltip: 'Win Rate %', useHeatmap: true, align: 'center', width: 'min-w-[70px]', formatter: (v, r) => {
        const wr = r.games_played > 0 ? (r.wins / r.games_played) * 100 : 0;
        return <span className={wr >= 50 ? "text-emerald-500 font-bold" : "text-red-400"}>{wr.toFixed(0)}%</span>
    } },
    { key: 'mvp_count', label: 'MVP', tooltip: 'Total MVPs', useHeatmap: true, align: 'center', width: 'min-w-[60px]' },
    { key: 'avg_acs', label: 'ACS', tooltip: 'Average Combat Score', useHeatmap: true, align: 'center', width: 'min-w-[70px]', formatter: (v: number) => Math.round(v).toLocaleString() },
    { key: 'kills_per_game', label: 'K', tooltip: 'Kills per Game', useHeatmap: true, align: 'center', width: 'min-w-[60px]', formatter: (v: number) => <span className="font-bold">{v.toFixed(1)}</span> },
    { key: 'deaths_per_game', label: 'D', tooltip: 'Deaths per Game', useHeatmap: true, invertHeatmap: true, align: 'center', width: 'min-w-[60px]', formatter: (v: number) => v.toFixed(1) },
    { key: 'assists_per_game', label: 'A', tooltip: 'Assists per Game', useHeatmap: true, align: 'center', width: 'min-w-[60px]', formatter: (v: number) => v.toFixed(1) },
    { key: 'avg_kda', label: 'KDA', tooltip: 'KDA Ratio', useHeatmap: true, align: 'center', width: 'min-w-[70px]', render: (r) => {
        const kda = (r.total_kills + r.total_assists) / (r.total_deaths || 1);
        return kda.toFixed(2);
    }},
    { key: 'avg_adr', label: 'ADR', tooltip: 'Avg Damage per Round', useHeatmap: true, align: 'center', width: 'min-w-[70px]', formatter: (v: number) => Math.round(v) },
    { key: 'avg_hs_percent', label: 'HS%', tooltip: 'Headshot %', useHeatmap: true, align: 'center', width: 'min-w-[70px]', formatter: (v: number) => v.toFixed(1) + '%' },
    { key: 'total_first_bloods', label: 'FB', tooltip: 'First Bloods', useHeatmap: true, align: 'center', width: 'min-w-[60px]' },
    { key: 'total_plants', label: 'PL', tooltip: 'Plants', useHeatmap: true, align: 'center', width: 'min-w-[60px]' },
    { key: 'total_defuses', label: 'DF', tooltip: 'Defuses', useHeatmap: true, align: 'center', width: 'min-w-[60px]' },
  ];

  return (
    <GenericStatsTable 
        title="Player Statistics"
        subtitle={`Showing all ${data.length} players • Sorted by ${sortColumn.replace('_', ' ')}`}
        icon={<Trophy className="h-5 w-5" />}
        data={data}
        columns={game === 'mlbb' ? mlbbColumns as any : valorantColumns as any}
        sortColumn={sortColumn}
        sortOrder={sortOrder}
        onSort={onSort}
        stickyFirstColumn={true}
    />
  );
}
