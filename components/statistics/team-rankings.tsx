import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, ChevronUp, ChevronDown, Crosshair, Zap } from 'lucide-react';
import { TeamStats, LEADERBOARD_METRICS } from '@/lib/types/stats-enhanced';
import { moderniz } from '@/lib/fonts';

interface TeamRankingsProps {
    game: 'mlbb' | 'valorant';
    data: TeamStats[];
    sortColumn: string;
    sortOrder: 'asc' | 'desc';
    onSort: (column: string) => void;
    isLoading?: boolean;
    className?: string; // Kept for compatibility but not strictly needed based on PlayerLeaderboard
}

// Columns definition matching PlayerLeaderboard style
const mlbbColumns = [
    { key: 'games_played', label: 'G', tooltip: 'Games Played', sortable: true, width: 'min-w-[50px] w-[50px]' },
    { key: 'win_rate', label: 'WR%', tooltip: 'Win Rate', sortable: true, width: 'min-w-[60px] w-[60px]' },
    { key: 'total_wins', label: 'W', tooltip: 'Wins', sortable: true, width: 'min-w-[50px] w-[50px]' },
    { key: 'total_losses', label: 'L', tooltip: 'Losses', sortable: true, width: 'min-w-[50px] w-[50px]' },
    { key: 'avg_kda', label: 'KDA', tooltip: 'KDA Ratio', sortable: true, width: 'min-w-[70px] w-[70px]' },
    { key: 'avg_kills_per_game', label: 'KPG', tooltip: 'Kills Per Game', sortable: true, width: 'min-w-[60px] w-[60px]' },
    { key: 'avg_deaths_per_game', label: 'DPG', tooltip: 'Deaths Per Game', sortable: true, width: 'min-w-[60px] w-[60px]' },
    { key: 'avg_gold_per_game', label: 'GPG', tooltip: 'Avg Gold Per Game', sortable: true, width: 'min-w-[80px] w-[80px]' },
    { key: 'total_turret_damage', label: 'TUR', tooltip: 'Turret Damage', sortable: true, width: 'min-w-[90px] w-[90px]' },
    { key: 'total_lord_slain', label: 'LRD', tooltip: 'Lords Slain', sortable: true, width: 'min-w-[60px] w-[60px]' },
    { key: 'total_turtle_slain', label: 'TRT', tooltip: 'Turtles Slain', sortable: true, width: 'min-w-[60px] w-[60px]' },
];

const valorantColumns = [
    { key: 'games_played', label: 'G', tooltip: 'Games Played', sortable: true, width: 'min-w-[50px] w-[50px]' },
    { key: 'win_rate', label: 'WR%', tooltip: 'Win Rate', sortable: true, width: 'min-w-[60px] w-[60px]' },
    { key: 'total_wins', label: 'W', tooltip: 'Wins', sortable: true, width: 'min-w-[50px] w-[50px]' },
    { key: 'total_losses', label: 'L', tooltip: 'Losses', sortable: true, width: 'min-w-[50px] w-[50px]' },
    { key: 'avg_kda', label: 'KDA', tooltip: 'KDA Ratio', sortable: true, width: 'min-w-[70px] w-[70px]' },
    { key: 'avg_kills_per_game', label: 'KPG', tooltip: 'Kills Per Game', sortable: true, width: 'min-w-[60px] w-[60px]' },
    { key: 'avg_deaths_per_game', label: 'DPG', tooltip: 'Deaths Per Game', sortable: true, width: 'min-w-[60px] w-[60px]' },
    { key: 'avg_acs', label: 'ACS', tooltip: 'Avg Combat Score', sortable: true, width: 'min-w-[80px] w-[80px]' },
    { key: 'total_first_bloods', label: 'FB', tooltip: 'First Bloods', sortable: true, width: 'min-w-[70px] w-[70px]' },
    { key: 'total_plants', label: 'PL', tooltip: 'Plants', sortable: true, width: 'min-w-[70px] w-[70px]' },
    { key: 'total_defuses', label: 'DF', tooltip: 'Defuses', sortable: true, width: 'min-w-[70px] w-[70px]' },
];

const podiumColors = [
    'bg-gradient-to-br from-yellow-400 to-yellow-600', // Gold
    'bg-gradient-to-br from-gray-300 to-gray-500', // Silver
    'bg-gradient-to-br from-amber-600 to-amber-800', // Bronze
];

export function TeamRankings({ 
    game, 
    data, 
    sortColumn,
    sortOrder,
    onSort,
    isLoading = false, 
    className 
}: TeamRankingsProps) {
    const columns = game === 'mlbb' ? mlbbColumns : valorantColumns;
    const top3 = [...data].sort((a, b) => (b.win_rate || 0) - (a.win_rate || 0)).slice(0, 3);

    // Calculate max values for heatmap scaling
    const maxValues = useMemo(() => {
        const max: Record<string, number> = {};
        columns.forEach(col => {
            if (col.key === 'win_rate' || col.key === 'avg_kda') {
                max[col.key] = 0; 
                data.forEach(d => {
                    let val = 0;
                    if (col.key === 'win_rate') val = d.win_rate; 
                    else if (col.key === 'avg_kda') val = (d.total_kills + d.total_assists) / (d.total_deaths || 1);
                    if (val > max[col.key]) max[col.key] = val;
                });
            } else {
                 max[col.key] = Math.max(...data.map(d => Number((d as any)[col.key]) || 0));
            }
        });
        return max;
    }, [data, columns]);

    const getHeatmapStyle = (value: number, key: string) => {
        const max = maxValues[key] || 1;
        if (value === 0 || max === 0) return {};

        const ratio = value / max;
        
        // Handling for "Lower is Better" stats (Deaths/Losses)
        if (key.includes('death') || key.includes('losses')) {
             if (ratio > 0.8) return { backgroundColor: 'rgba(239, 68, 68, 0.15)' }; // Red tint
             return {};
        }

        // Stats where Higher is Better
        if (ratio >= 0.9) return { backgroundColor: 'rgba(16, 185, 129, 0.2)' }; // Emerald
        if (ratio >= 0.7) return { backgroundColor: 'rgba(59, 130, 246, 0.15)' }; // Blue
        if (ratio >= 0.5) return { backgroundColor: 'rgba(59, 130, 246, 0.05)' }; // Subtle Blue
        
        return {};
    };

    const formatValue = (row: TeamStats, key: string): string => {
        let value = (row as any)[key];
        
        if (key === 'avg_kda') {
             return ((row.total_kills + row.total_assists) / (row.total_deaths || 1)).toFixed(2);
        }

        if (value === null || value === undefined) return '-';
        if (typeof value === 'number') {
            if (key.includes('win_rate')) {
                return value.toFixed(0) + '%';
            }
            if (key.includes('per_game') || key.includes('avg_') || key.includes('kda')) {
                return value.toFixed(1);
            }
            // Large numbers (Damage, Gold)
            if (key.includes('damage') || key.includes('gold') && value > 1000) {
                 return (value / 1000).toFixed(1) + 'k';
            }
            return Math.round(value).toLocaleString();
        }
        return String(value);
    };

    const getRawValue = (row: TeamStats, key: string): number => {
         if (key === 'avg_kda') return (row.total_kills + row.total_assists) / (row.total_deaths || 1);
         return Number((row as any)[key]) || 0;
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortColumn !== column) return null;
        return sortOrder === 'asc' ? (
            <ChevronUp className="h-3 w-3 inline-block ml-1 opacity-70" />
        ) : (
            <ChevronDown className="h-3 w-3 inline-block ml-1 opacity-70" />
        );
    };

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

    return (
        <div className={cn('space-y-8', className)}>
            {/* Top 3 Podium Cards */}
            <div className="hidden lg:grid grid-cols-3 gap-6 mb-12 px-4">
                {top3.map((team, index) => (
                    <Card
                        key={`team-podium-${team.team_id}-${index}`}
                        className={cn(
                            'relative overflow-hidden transition-all hover:scale-[1.02] duration-300 border-border/50 bg-card/40 backdrop-blur-md shadow-xl group',
                            index === 0 && 'lg:order-2 border-yellow-500/30 shadow-yellow-500/10 h-[380px] z-10', 
                            index === 1 && 'lg:order-1 border-slate-400/30 shadow-slate-400/10 h-[350px] mt-auto',
                            index === 2 && 'lg:order-3 border-orange-700/30 shadow-orange-700/10 h-[340px] mt-auto'
                        )}
                    >
                         <div className={cn("absolute inset-0 opacity-[0.05] bg-gradient-to-b pointer-events-none group-hover:opacity-[0.08] transition-opacity", podiumColors[index])} />

                        {/* Rank Badge */}
                        <div className={cn(
                                'absolute top-0 right-0 px-5 py-2 rounded-bl-2xl font-black text-white shadow-lg text-lg tracking-tighter',
                                podiumColors[index]
                            )}>
                            #{index + 1}
                        </div>

                        <CardContent className="pt-10 pb-6 flex flex-col items-center text-center relative z-10 h-full">
                            <div className="relative mb-6">
                                <div className={cn("absolute -inset-4 rounded-full blur-xl opacity-30 animate-pulse", podiumColors[index])} />
                                <Avatar className="w-24 h-24 border-4 border-background shadow-2xl relative z-10">
                                    <AvatarImage src={team.school_logo_url || team.team_logo_url || ''} className="object-cover" />
                                    <AvatarFallback className="text-2xl font-black bg-muted">
                                        {team.school_abbreviation?.substring(0, 2) || team.team_name.substring(0, 2)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <div className="mt-2 space-y-1">
                                <h3 className={cn(moderniz.className, "text-2xl font-bold tracking-wide uppercase truncate max-w-[200px]")}>
                                    {team.school_abbreviation}
                                </h3>
                                <p className="text-sm text-muted-foreground font-medium truncate max-w-[200px] mx-auto">
                                    {team.team_name}
                                </p>
                            </div>
                            
                           <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                                <div className="bg-background/40 rounded-xl p-3 border border-border/30 backdrop-blur-sm">
                                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                                        <Crosshair className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">KPG</span>
                                    </div>
                                    <p className="text-xl font-black">{team.avg_kills_per_game.toFixed(1)}</p>
                                </div>
                                <div className="bg-background/40 rounded-xl p-3 border border-border/30 backdrop-blur-sm">
                                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                                        <Zap className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">WR%</span>
                                    </div>
                                    <p className="text-xl font-black">{team.win_rate.toFixed(0)}%</p>
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
                         <div className={cn("p-2 rounded-lg bg-primary/10", game === 'mlbb' ? "text-blue-400" : "text-red-400")}>
                             <Trophy className="h-5 w-5" />
                         </div>
                         <div>
                            <h3 className={cn(moderniz.className, "text-xl font-bold tracking-wide")}>Team Statistics</h3>
                            <p className="text-xs text-muted-foreground font-medium">
                                Showing all {data.length} teams • Sorted by {columns.find(c => c.key === sortColumn)?.tooltip || LEADERBOARD_METRICS.find(m => m.metric === sortColumn)?.label || sortColumn}
                            </p>
                         </div>
                    </div>
                </div>

                <div className="overflow-x-auto relative">
                    <table className="w-max min-w-full caption-bottom text-sm border-collapse">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border/50 hover:bg-muted/30 text-left">
                                <th className="sticky left-0 z-20 w-[220px] md:w-[320px] pl-8 text-xs uppercase font-bold tracking-wider text-muted-foreground/80 h-10 bg-background/95 shadow-[1px_0_0_0_rgba(255,255,255,0.05)] backdrop-blur-sm">
                                    Team Identity
                                </th>
                                {columns.map((col) => (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            col.width,
                                            "min-w-max text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-4 h-10 select-none bg-background/95 backdrop-blur-sm",
                                            col.sortable && 'cursor-pointer hover:bg-muted/50 transition-colors'
                                        )}
                                        onClick={() => col.sortable && onSort(col.key)}
                                    >
                                        <div className="flex items-center justify-center gap-1 h-full">
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className={cn(
                                                            "flex items-center gap-1",
                                                            col.tooltip && "cursor-help decoration-dotted underline-offset-4 hover:underline decoration-muted-foreground/50"
                                                        )}>
                                                            {col.label}
                                                            {col.sortable && <SortIcon column={col.key} />}
                                                        </span>
                                                    </TooltipTrigger>
                                                    {col.tooltip && (
                                                        <TooltipContent 
                                                            side="top" 
                                                            className="bg-popover text-popover-foreground text-xs font-medium px-3 py-1.5 border border-border/50 shadow-xl"
                                                        >
                                                            <p>{col.tooltip}</p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, idx) => (
                                <tr 
                                    key={`${row.team_id}-${idx}`}
                                    className="group hover:bg-muted/20 border-b border-border/30 transition-colors h-[60px]"
                                >
                                    <td className="sticky left-0 z-10 pl-8 py-2 bg-card/95 group-hover:bg-muted/20 backdrop-blur-sm shadow-[1px_0_0_0_rgba(255,255,255,0.05)] w-[220px] md:w-[320px] max-w-[220px] md:max-w-[320px] transition-colors">
                                        <div className="flex items-center gap-6">
                                            <div className={cn(
                                                "w-6 text-center font-bold text-sm flex-shrink-0",
                                                idx < 3 ? "text-amber-400 scale-110" : "text-muted-foreground"
                                            )}>
                                                {idx + 1}
                                            </div>

                                            <Avatar className={cn(
                                                "w-10 h-10 border border-border bg-muted flex-shrink-0",
                                                idx < 3 && "ring-2 ring-amber-500/20"
                                            )}>
                                                <AvatarImage src={row.school_logo_url || row.team_logo_url || ''} className="object-cover" />
                                                <AvatarFallback className="text-xs font-bold">
                                                    {row.school_abbreviation?.substring(0, 2)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-foreground truncate max-w-[100px] md:max-w-[140px] group-hover:text-primary transition-colors">
                                                        {row.school_abbreviation}
                                                    </span>
                                                </div>
                                                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 font-medium truncate max-w-[120px] md:max-w-[160px]">
                                                    {row.team_name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {columns.map((col) => {
                                        const rawValue = getRawValue(row, col.key);
                                        const displayValue = formatValue(row, col.key);
                                        const heatmapStyle = getHeatmapStyle(rawValue, col.key);

                                        return (
                                            <td 
                                                key={`${col.key}-${idx}`} 
                                                className="p-0 h-full border-l border-border/10"
                                            >
                                                <div 
                                                    className="w-full h-full flex items-center justify-center min-h-[60px] px-4"
                                                    style={heatmapStyle}
                                                >
                                                    <span className={cn(
                                                        "text-xs font-medium tabular-nums whitespace-nowrap",
                                                        col.key === sortColumn ? "font-bold text-foreground" : "text-muted-foreground"
                                                    )}>
                                                        {displayValue}
                                                    </span>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center text-xs text-muted-foreground pb-8">
                Showing all teams • Stats aggregated across all selected stages
            </div>
        </div>
    );
}
