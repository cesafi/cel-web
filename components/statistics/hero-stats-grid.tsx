'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, TrendingUp, Target, Users } from 'lucide-react';
import { HeroStats } from '@/lib/types/stats-enhanced';

interface HeroStatsGridProps {
    data: HeroStats[];
    isLoading?: boolean;
    className?: string;
}

// Progress component for stats bars
function StatBar({
    value,
    max,
    label,
    color = 'blue'
}: {
    value: number;
    max: number;
    label: string;
    color?: 'blue' | 'green' | 'red' | 'yellow'
}) {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        red: 'bg-red-500',
        yellow: 'bg-yellow-500',
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value.toFixed(1)}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn('h-full rounded-full transition-all', colorClasses[color])}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
}

export function HeroStatsGrid({ data, isLoading = false, className }: HeroStatsGridProps) {
    if (data.length === 0) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground">
                        No hero statistics available yet.
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Get max values for scaling bars
    const maxPickRate = Math.max(...data.map(h => h.pick_rate), 1);
    const maxKDA = Math.max(...data.map(h => h.avg_kda), 1);
    const maxGold = Math.max(...data.map(h => h.avg_gold), 1);
    const maxDamage = Math.max(...data.map(h => h.avg_damage_dealt), 1);

    // Top 5 heroes for highlight section
    const topHeroes = data.slice(0, 5);

    return (
        <div className={cn('space-y-6', className)}>
            {/* Top 5 Spotlight */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Most Picked Heroes
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {topHeroes.map((hero, index) => (
                        <Card key={hero.hero_name} className="relative overflow-hidden hover:shadow-md transition-shadow">
                            {/* Rank Badge */}
                            <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="text-xs">
                                    #{index + 1}
                                </Badge>
                            </div>

                            <CardContent className="pt-8 pb-4">
                                <div className="flex flex-col items-center text-center">
                                    {/* Hero Icon Placeholder */}
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/30 flex items-center justify-center mb-3 border-2 border-blue-500/30">
                                        {hero.icon_url ? (
                                            <img src={hero.icon_url} alt={hero.hero_name} className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <Swords className="w-6 h-6 text-blue-500" />
                                        )}
                                    </div>

                                    <h4 className="font-semibold text-sm truncate w-full">{hero.hero_name}</h4>

                                    <div className="mt-2 text-xs text-muted-foreground">
                                        {hero.games_played} games
                                    </div>

                                    <div className="mt-3 w-full">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-muted-foreground">Pick Rate</span>
                                            <span className="font-bold text-blue-500">{hero.pick_rate.toFixed(1)}%</span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                                style={{ width: `${(hero.pick_rate / maxPickRate) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Full Hero Grid */}
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    All Heroes ({data.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {data.map((hero) => (
                        <Card key={hero.hero_name} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    {/* Hero Icon */}
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {hero.icon_url ? (
                                            <img src={hero.icon_url} alt={hero.hero_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Swords className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>

                                    {/* Hero Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold truncate">{hero.hero_name}</h4>
                                        <p className="text-xs text-muted-foreground">{hero.games_played} games played</p>
                                    </div>

                                    {/* Pick Rate Badge */}
                                    <Badge variant="outline" className="text-xs">
                                        {hero.pick_rate.toFixed(1)}%
                                    </Badge>
                                </div>

                                {/* Stats Bars */}
                                <div className="mt-4 space-y-2">
                                    <StatBar value={hero.avg_kda} max={maxKDA} label="Avg KDA" color="blue" />
                                    <StatBar value={hero.avg_gold} max={maxGold} label="Avg Gold" color="yellow" />
                                    <StatBar value={hero.avg_damage_dealt} max={maxDamage} label="Avg Damage" color="red" />
                                </div>

                                {/* Quick Stats */}
                                <div className="mt-3 pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <p className="text-sm font-semibold text-green-500">{hero.avg_kills.toFixed(1)}</p>
                                        <p className="text-xs text-muted-foreground">K</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-red-500">{hero.avg_deaths.toFixed(1)}</p>
                                        <p className="text-xs text-muted-foreground">D</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-blue-500">{hero.avg_assists.toFixed(1)}</p>
                                        <p className="text-xs text-muted-foreground">A</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
