'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, TrendingUp, Ban, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { MapStats } from '@/lib/types/stats-enhanced';
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MapStatsDisplayProps {
    data: MapStats[];
    isLoading?: boolean;
    className?: string;
}

type SortColumn = 'pick_rate' | 'ban_rate' | 'total_games' | 'attack_win_rate' | 'defense_win_rate';
type SortDirection = 'asc' | 'desc';

const podiumColors = [
    "from-yellow-500/80 to-yellow-600/30", // 1st
    "from-slate-400/80 to-slate-500/30",  // 2nd
    "from-orange-700/80 to-orange-800/30" // 3rd
];

export function MapStatsDisplay({ data, isLoading = false, className }: MapStatsDisplayProps) {
    const [sortColumn, setSortColumn] = useState<SortColumn>('total_games');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground">
                        No map statistics available yet.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const maxPickRate = Math.max(...data.map(m => m.pick_rate), 1);
    const maxBanRate = Math.max(...data.map(m => m.ban_rate), 1);

    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const sortedData = [...data].sort((a, b) => {
        const valA = a[sortColumn] || 0;
        const valB = b[sortColumn] || 0;
        return sortDirection === 'desc' ? valB - valA : valA - valB;
    });

    // The top 3 maps are derived from the generic data sorted by total games ALWAYS, not the current sort, for consistency in the podium.
    const overallTop3 = [...data].sort((a, b) => b.total_games - a.total_games).slice(0, 3);

    const SortIcon = ({ column }: { column: SortColumn }) => {
        if (sortColumn !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
        return sortDirection === 'desc' ? <ArrowDown className="w-3 h-3 ml-1 text-primary" /> : <ArrowUp className="w-3 h-3 ml-1 text-primary" />;
    };

    return (
        <div className={cn('space-y-12', className)}>
            {/* Top 3 Podium (Always visible based on Highest Pick Rate) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 pt-8 max-w-5xl mx-auto">
                {overallTop3.map((map, index) => (
                    <Card
                        key={`map-podium-${index}`}
                        className={cn(
                            'relative overflow-hidden transition-all hover:scale-[1.02] duration-300 border-border/50 bg-card/40 backdrop-blur-md shadow-xl group',
                            index === 0 && 'lg:order-2 border-yellow-500/30 shadow-yellow-500/10 h-[380px] z-10',
                            index === 1 && 'lg:order-1 border-slate-400/30 shadow-slate-400/10 h-[350px] mt-auto',
                            index === 2 && 'lg:order-3 border-orange-700/30 shadow-orange-700/10 h-[340px] mt-auto'
                        )}
                    >
                        <div className={cn("absolute inset-0 opacity-[0.10] bg-gradient-to-b pointer-events-none transition-opacity", podiumColors[index])} />

                        {map.splash_image_url && (
                            <div className="absolute inset-0 z-0">
                                <Image src={map.splash_image_url} alt={map.map_name} fill className="object-cover opacity-[0.15] group-hover:opacity-[0.25] transition-opacity grayscale-[50%]" />
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                            </div>
                        )}

                        {/* Rank Badge */}
                        <div className={cn(
                            'absolute top-0 right-0 px-5 py-2 rounded-bl-2xl font-black text-white shadow-lg text-lg tracking-tighter z-20',
                            podiumColors[index]
                        )}>
                            #{index + 1}
                        </div>

                        <CardContent className="pt-10 pb-6 flex flex-col items-center text-center relative z-10 h-full">
                            <div className="relative mb-6">
                                <div className={cn("absolute -inset-4 rounded-full blur-xl opacity-30 animate-pulse", podiumColors[index])} />
                                <div className="w-40 h-24 rounded-lg overflow-hidden border-4 border-background shadow-2xl relative z-10 bg-muted flex items-center justify-center">
                                    {map.splash_image_url ? (
                                        <Image src={map.splash_image_url} alt={map.map_name} fill className="object-cover" />
                                    ) : (
                                        <Map className="w-8 h-8 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            <div className="mt-2 space-y-1">
                                <h3 className="text-2xl font-black tracking-wide uppercase truncate max-w-[200px]">
                                    {map.map_name}
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                                <div className="bg-background/60 rounded-xl p-3 border border-border/30 backdrop-blur-sm shadow-inner">
                                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                                        <TrendingUp className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">PICKS</span>
                                    </div>
                                    <p className="text-xl font-black text-green-500">{map.total_picks}</p>
                                </div>
                                <div className="bg-background/60 rounded-xl p-3 border border-border/30 backdrop-blur-sm shadow-inner">
                                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                                        <Ban className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">BANS</span>
                                    </div>
                                    <p className="text-xl font-black text-red-500">{map.total_bans}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Dense Data Table */}
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-border/30 flex items-center justify-between bg-muted/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Map className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold tracking-wide uppercase">
                                Map Statistics
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">
                                Showing all {data.length} maps • Sorted by Matches Played
                            </p>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto relative">
                    <table className="w-max min-w-full caption-bottom text-sm border-collapse">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border/50 hover:bg-muted/30 text-left">
                                <th className="sticky left-0 z-20 w-[220px] md:w-[320px] pl-8 text-xs uppercase font-bold tracking-wider text-muted-foreground/80 h-10 bg-background/95 shadow-[1px_0_0_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
                                    Map Details
                                </th>
                                <th className="min-w-[120px] cursor-pointer hover:bg-muted/50 transition-colors px-4 text-center text-xs uppercase font-bold tracking-wider text-muted-foreground/80 h-10 select-none bg-background/95" onClick={() => handleSort('total_games')}>
                                    <span className="flex justify-center items-center gap-1">Matches <SortIcon column="total_games" /></span>
                                </th>
                                <th className="min-w-[120px] cursor-pointer hover:bg-muted/50 transition-colors px-4 text-center text-xs uppercase font-bold tracking-wider text-muted-foreground/80 h-10 select-none bg-background/95" onClick={() => handleSort('pick_rate')}>
                                    <span className="flex justify-center items-center gap-1">Pick Rate <SortIcon column="pick_rate" /></span>
                                </th>
                                <th className="min-w-[120px] cursor-pointer hover:bg-muted/50 transition-colors px-4 text-center text-xs uppercase font-bold tracking-wider text-muted-foreground/80 h-10 select-none bg-background/95" onClick={() => handleSort('ban_rate')}>
                                    <span className="flex justify-center items-center gap-1">Ban Rate <SortIcon column="ban_rate" /></span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((map, idx) => (
                                <tr
                                    key={`map-row-${map.map_name}`}
                                    className="group hover:bg-muted/20 border-b border-border/30 transition-colors h-[72px]"
                                >
                                    <td className="sticky left-0 z-10 pl-8 py-2 bg-card/95 group-hover:bg-muted/20 backdrop-blur-sm shadow-[1px_0_0_0_rgba(255,255,255,0.05)] w-[220px] md:w-[320px] transition-colors">
                                        <div className="flex items-center gap-6">
                                            <div className="w-6 text-center font-bold text-sm flex-shrink-0 text-muted-foreground">
                                                {idx + 1}
                                            </div>

                                            <div className="w-20 h-12 relative rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50 shadow-sm">
                                                {map.splash_image_url ? (
                                                    <Image
                                                        src={map.splash_image_url}
                                                        alt={map.map_name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Map className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            <span className="font-bold text-sm text-foreground truncate max-w-[100px] md:max-w-[140px] group-hover:text-primary transition-colors">
                                                {map.map_name}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-0 border-l border-border/10">
                                        <div className="w-full h-full flex items-center justify-center min-h-[72px] px-4">
                                            <span className="text-sm font-bold tabular-nums">
                                                {map.total_games}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="p-0 border-l border-border/10 relative">
                                        <div className="absolute inset-0 opacity-10" style={{
                                            background: `linear-gradient(90deg, #22c55e ${map.pick_rate}%, transparent ${map.pick_rate}%)`
                                        }} />
                                        <div className="w-full h-full flex flex-col items-center justify-center min-h-[72px] px-4 relative z-10">
                                            <span className="text-sm font-bold text-green-500 tabular-nums">
                                                {map.pick_rate.toFixed(1)}%
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{map.total_picks} Picks</span>
                                        </div>
                                    </td>

                                    <td className="p-0 border-l border-border/10 relative">
                                        <div className="absolute inset-0 opacity-10" style={{
                                            background: `linear-gradient(90deg, #ef4444 ${map.ban_rate}%, transparent ${map.ban_rate}%)`
                                        }} />
                                        <div className="w-full h-full flex flex-col items-center justify-center min-h-[72px] px-4 relative z-10">
                                            <span className="text-sm font-bold text-red-500 tabular-nums">
                                                {map.ban_rate.toFixed(1)}%
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{map.total_bans} Bans</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center text-xs text-muted-foreground pb-8">
                Showing all maps • Stats aggregated across all selected stages
            </div>
        </div>
    );
}
