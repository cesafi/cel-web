'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, ChevronUp, ChevronDown, Medal } from 'lucide-react';
import { MlbbPlayerStats, ValorantPlayerStats } from '@/services/statistics';
import Image from 'next/image';

interface PlayerLeaderboardProps {
    game: 'mlbb' | 'valorant';
    data: (MlbbPlayerStats | ValorantPlayerStats)[];
    sortColumn: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: string) => void;
    isLoading?: boolean;
}

const mlbbColumns = [
    { key: 'player_ign', label: 'Player', sortable: true, width: 'min-w-[180px]' },
    { key: 'team_name', label: 'Team', sortable: true, width: 'min-w-[120px]' },
    { key: 'hero_name', label: 'Hero', sortable: true, width: 'min-w-[100px]' },
    { key: 'games_played', label: 'Games', sortable: true, width: 'w-[70px]' },
    { key: 'mvp_count', label: 'MVP', sortable: true, width: 'w-[60px]' },
    { key: 'kills_per_game', label: 'KPG', sortable: true, width: 'w-[70px]' },
    { key: 'deaths_per_game', label: 'DPG', sortable: true, width: 'w-[70px]' },
    { key: 'assists_per_game', label: 'APG', sortable: true, width: 'w-[70px]' },
    { key: 'avg_gpm', label: 'GPM', sortable: true, width: 'w-[80px]' },
];

const valorantColumns = [
    { key: 'player_ign', label: 'Player', sortable: true, width: 'min-w-[180px]' },
    { key: 'team_name', label: 'Team', sortable: true, width: 'min-w-[120px]' },
    { key: 'agent_name', label: 'Agent', sortable: true, width: 'min-w-[100px]' },
    { key: 'games_played', label: 'Games', sortable: true, width: 'w-[70px]' },
    { key: 'avg_acs', label: 'ACS', sortable: true, width: 'w-[70px]' },
    { key: 'kills_per_game', label: 'KPG', sortable: true, width: 'w-[70px]' },
    { key: 'deaths_per_game', label: 'DPG', sortable: true, width: 'w-[70px]' },
    { key: 'assists_per_game', label: 'APG', sortable: true, width: 'w-[70px]' },
    { key: 'total_first_bloods', label: 'FB', sortable: true, width: 'w-[60px]' },
];

const podiumColors = [
    'bg-gradient-to-br from-yellow-400 to-yellow-600', // Gold
    'bg-gradient-to-br from-gray-300 to-gray-500', // Silver
    'bg-gradient-to-br from-amber-600 to-amber-800', // Bronze
];

export function PlayerLeaderboard({
    game,
    data,
    sortColumn,
    sortOrder,
    onSort,
    isLoading = false,
}: PlayerLeaderboardProps) {
    const columns = game === 'mlbb' ? mlbbColumns : valorantColumns;
    const top3 = data.slice(0, 3);
    const rest = data.slice(3);
    const gameColor = game === 'mlbb' ? 'blue' : 'red';

    const formatValue = (value: any, key: string): string => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') {
            if (key.includes('per_game') || key.includes('avg_')) {
                return value.toFixed(2);
            }
            return Math.round(value).toLocaleString();
        }
        return String(value);
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortColumn !== column) return null;
        return sortOrder === 'asc' ? (
            <ChevronUp className="h-4 w-4 inline-block ml-1" />
        ) : (
            <ChevronDown className="h-4 w-4 inline-block ml-1" />
        );
    };

    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground">
                        No player statistics available yet.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top 3 Podium (Desktop only) */}
            <div className="hidden lg:grid grid-cols-3 gap-4">
                {top3.map((player, index) => (
                    <Card
                        key={player.player_id}
                        className={cn(
                            'relative overflow-hidden transition-all hover:shadow-lg',
                            index === 0 && 'lg:order-2', // Gold in center
                            index === 1 && 'lg:order-1', // Silver on left
                            index === 2 && 'lg:order-3' // Bronze on right
                        )}
                    >
                        {/* Rank Badge */}
                        <div
                            className={cn(
                                'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
                                podiumColors[index]
                            )}
                        >
                            {index + 1}
                        </div>

                        <CardContent className="pt-6 pb-4">
                            <div className="flex flex-col items-center text-center">
                                <Avatar className="w-16 h-16 mb-3 border-2 border-border">
                                    <AvatarImage src={player.player_photo_url || ''} />
                                    <AvatarFallback className="text-lg">
                                        {player.player_ign.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <h3 className="font-bold text-lg">{player.player_ign}</h3>

                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                    {player.team_logo_url && (
                                        <Image
                                            src={player.team_logo_url}
                                            alt={player.team_name || ''}
                                            width={16}
                                            height={16}
                                            className="rounded"
                                        />
                                    )}
                                    <span>{player.team_name || 'No Team'}</span>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-4 w-full">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{formatValue(player.kills_per_game, 'kills_per_game')}</p>
                                        <p className="text-xs text-muted-foreground">KPG</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{player.games_played}</p>
                                        <p className="text-xs text-muted-foreground">Games</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{player.mvp_count}</p>
                                        <p className="text-xs text-muted-foreground">MVP</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Full Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className={`h-5 w-5 text-${gameColor}-500`} />
                        Player Rankings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    {columns.map((col) => (
                                        <TableHead
                                            key={col.key}
                                            className={cn(
                                                col.width,
                                                col.sortable && 'cursor-pointer hover:bg-muted/50 select-none'
                                            )}
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
                                        <TableCell className="font-medium">
                                            {idx < 3 ? (
                                                <span
                                                    className={cn(
                                                        'inline-flex w-6 h-6 rounded-full items-center justify-center text-xs text-white font-bold',
                                                        podiumColors[idx]
                                                    )}
                                                >
                                                    {idx + 1}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">{idx + 1}</span>
                                            )}
                                        </TableCell>
                                        {columns.map((col) => (
                                            <TableCell key={col.key}>
                                                {col.key === 'player_ign' ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-8 h-8">
                                                            <AvatarImage src={row.player_photo_url || ''} />
                                                            <AvatarFallback className="text-xs">
                                                                {row.player_ign.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{row.player_ign}</span>
                                                    </div>
                                                ) : col.key === 'team_name' ? (
                                                    <div className="flex items-center gap-2">
                                                        {row.team_logo_url && (
                                                            <Image
                                                                src={row.team_logo_url}
                                                                alt={row.team_name || ''}
                                                                width={20}
                                                                height={20}
                                                                className="rounded"
                                                            />
                                                        )}
                                                        <span className="truncate max-w-[100px]">
                                                            {row.team_name || '-'}
                                                        </span>
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
                </CardContent>
            </Card>
        </div>
    );
}
