'use client';

import { MlbbPlayerStats, ValorantPlayerStats } from '@/services/statistics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface PlayerStatsTableProps {
  game: 'mlbb' | 'valorant';
  data: (MlbbPlayerStats | ValorantPlayerStats)[];
  sortColumn: string;
  sortOrder: 'asc' | 'desc';
  onSort: (column: string) => void;
}

const mlbbColumns = [
  { key: 'player_ign', label: 'Player', sortable: true },
  { key: 'team_name', label: 'Team', sortable: true },
  { key: 'hero_name', label: 'Hero', sortable: true },
  { key: 'games_played', label: 'GMS', sortable: true },
  { key: 'mvp_count', label: 'MVP', sortable: true },
  { key: 'kills_per_game', label: 'KPG', sortable: true },
  { key: 'deaths_per_game', label: 'DPG', sortable: true },
  { key: 'assists_per_game', label: 'APG', sortable: true },
  { key: 'avg_gpm', label: 'GPM', sortable: true },
  { key: 'total_damage_dealt', label: 'HDMG', sortable: true },
  { key: 'total_turret_damage', label: 'TDMG', sortable: true },
];

const valorantColumns = [
  { key: 'player_ign', label: 'Player', sortable: true },
  { key: 'team_name', label: 'Team', sortable: true },
  { key: 'agent_name', label: 'Agent', sortable: true },
  { key: 'games_played', label: 'GMS', sortable: true },
  { key: 'mvp_count', label: 'MVP', sortable: true },
  { key: 'avg_acs', label: 'ACS', sortable: true },
  { key: 'kills_per_game', label: 'KPG', sortable: true },
  { key: 'deaths_per_game', label: 'DPG', sortable: true },
  { key: 'assists_per_game', label: 'APG', sortable: true },
  { key: 'avg_adr', label: 'ADR', sortable: true },
  { key: 'avg_hs_percent', label: 'HS%', sortable: true },
  { key: 'total_first_bloods', label: 'FB', sortable: true },
];

export function PlayerStatsTable({
  game,
  data,
  sortColumn,
  sortOrder,
  onSort
}: PlayerStatsTableProps) {
  const columns = game === 'mlbb' ? mlbbColumns : valorantColumns;

  const formatValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      if (key.includes('per_game') || key.includes('avg_') || key.includes('percent')) {
        return value.toFixed(2);
      }
      return Math.round(value).toLocaleString();
    }
    return String(value);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 inline-block ml-1" />
      : <ChevronDown className="h-4 w-4 inline-block ml-1" />;
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No statistics available for {game === 'mlbb' ? 'Mobile Legends' : 'Valorant'} yet.
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={col.sortable ? 'cursor-pointer hover:bg-muted/50 select-none' : ''}
                onClick={() => col.sortable && onSort(col.key)}
              >
                {col.label}
                {col.sortable && <SortIcon column={col.key} />}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={row.player_id || idx}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {col.key === 'player_ign' ? (
                    <div className="flex items-center gap-2">
                      {row.player_photo_url ? (
                        <Image
                          src={row.player_photo_url}
                          alt={row.player_ign}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted" />
                      )}
                      <span className="font-medium">{row.player_ign}</span>
                    </div>
                  ) : col.key === 'team_name' ? (
                    <div className="flex items-center gap-2">
                      {row.team_logo_url && (
                        <Image
                          src={row.team_logo_url}
                          alt={row.team_name || ''}
                          width={24}
                          height={24}
                          className="rounded"
                        />
                      )}
                      <span>{row.team_name || '-'}</span>
                    </div>
                  ) : (
                    formatValue((row as any)[col.key], col.key)
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
