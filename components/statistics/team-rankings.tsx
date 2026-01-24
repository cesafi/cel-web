'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, ChevronUp, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { TeamStats } from '@/lib/types/stats-enhanced';
import Image from 'next/image';

interface TeamRankingsProps {
    game: 'mlbb' | 'valorant';
    data: TeamStats[];
    isLoading?: boolean;
    className?: string;
}

export function TeamRankings({ game, data, isLoading = false, className }: TeamRankingsProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground">
                        No team statistics available yet.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const gameColor = game === 'mlbb' ? 'blue' : 'red';

    return (
        <div className={cn('space-y-6', className)}>
            {/* Top 3 Teams Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {data.slice(0, 3).map((team, index) => {
                    const isPositive = team.win_rate >= 50;
                    return (
                        <Card
                            key={team.team_id}
                            className={cn(
                                'relative overflow-hidden',
                                index === 0 && 'md:order-2 ring-2 ring-yellow-500/50', // Gold in center
                                index === 1 && 'md:order-1',
                                index === 2 && 'md:order-3'
                            )}
                        >
                            {/* Rank Badge */}
                            <div className={cn(
                                'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
                                index === 0 && 'bg-gradient-to-br from-yellow-400 to-yellow-600',
                                index === 1 && 'bg-gradient-to-br from-gray-300 to-gray-500',
                                index === 2 && 'bg-gradient-to-br from-amber-600 to-amber-800'
                            )}>
                                {index + 1}
                            </div>

                            <CardContent className="pt-6 pb-4">
                                <div className="flex flex-col items-center text-center">
                                    {/* Team Logo */}
                                    <Avatar className="w-16 h-16 mb-3 border-2 border-border">
                                        <AvatarImage src={team.school_logo_url || ''} />
                                        <AvatarFallback className="text-lg bg-muted">
                                            {team.school_abbreviation || team.team_name.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <h3 className="font-bold text-lg">{team.school_abbreviation || team.team_name}</h3>
                                    <p className="text-sm text-muted-foreground">{team.school_name}</p>

                                    {/* Win Rate */}
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className={cn(
                                            'text-3xl font-bold',
                                            isPositive ? 'text-green-500' : 'text-red-500'
                                        )}>
                                            {team.win_rate.toFixed(1)}%
                                        </span>
                                        {isPositive ? (
                                            <TrendingUp className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 text-red-500" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Win Rate</p>

                                    {/* Record */}
                                    <div className="mt-4 flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-green-500">{team.total_wins}</p>
                                            <p className="text-xs text-muted-foreground">Wins</p>
                                        </div>
                                        <div className="text-2xl text-muted-foreground">-</div>
                                        <div className="text-center">
                                            <p className="text-xl font-bold text-red-500">{team.total_losses}</p>
                                            <p className="text-xs text-muted-foreground">Losses</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Full Team Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Trophy className={`h-5 w-5 text-${gameColor}-500`} />
                        Team Rankings
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead className="min-w-[200px]">Team</TableHead>
                                    <TableHead className="w-[80px] text-center">Games</TableHead>
                                    <TableHead className="w-[80px] text-center">W</TableHead>
                                    <TableHead className="w-[80px] text-center">L</TableHead>
                                    <TableHead className="w-[100px] text-center">Win Rate</TableHead>
                                    <TableHead className="w-[80px] text-center">KPG</TableHead>
                                    <TableHead className="w-[80px] text-center">DPG</TableHead>
                                    {game === 'mlbb' && (
                                        <TableHead className="w-[100px] text-center">Avg Gold</TableHead>
                                    )}
                                    {game === 'valorant' && (
                                        <TableHead className="w-[80px] text-center">ACS</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((team, idx) => {
                                    const isPositive = team.win_rate >= 50;
                                    return (
                                        <TableRow key={team.team_id}>
                                            <TableCell className="font-medium">
                                                {idx < 3 ? (
                                                    <span className={cn(
                                                        'inline-flex w-6 h-6 rounded-full items-center justify-center text-xs text-white font-bold',
                                                        idx === 0 && 'bg-gradient-to-br from-yellow-400 to-yellow-600',
                                                        idx === 1 && 'bg-gradient-to-br from-gray-300 to-gray-500',
                                                        idx === 2 && 'bg-gradient-to-br from-amber-600 to-amber-800'
                                                    )}>
                                                        {idx + 1}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">{idx + 1}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarImage src={team.school_logo_url || ''} />
                                                        <AvatarFallback className="text-xs">
                                                            {team.school_abbreviation || team.team_name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{team.school_abbreviation || team.team_name}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                            {team.school_name}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{team.games_played}</TableCell>
                                            <TableCell className="text-center text-green-500 font-medium">{team.total_wins}</TableCell>
                                            <TableCell className="text-center text-red-500 font-medium">{team.total_losses}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={isPositive ? 'default' : 'secondary'} className={cn(
                                                    isPositive ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                                )}>
                                                    {team.win_rate.toFixed(1)}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">{team.avg_kills_per_game.toFixed(1)}</TableCell>
                                            <TableCell className="text-center">{team.avg_deaths_per_game.toFixed(1)}</TableCell>
                                            {game === 'mlbb' && (
                                                <TableCell className="text-center">
                                                    {team.avg_gold_per_game?.toFixed(0) || '-'}
                                                </TableCell>
                                            )}
                                            {game === 'valorant' && (
                                                <TableCell className="text-center">
                                                    {team.avg_acs?.toFixed(0) || '-'}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
