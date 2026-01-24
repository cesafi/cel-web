'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Map, TrendingUp, Ban } from 'lucide-react';
import { MapStats } from '@/lib/types/stats-enhanced';
import Image from 'next/image';

interface MapStatsDisplayProps {
    data: MapStats[];
    isLoading?: boolean;
    className?: string;
}

export function MapStatsDisplay({ data, isLoading = false, className }: MapStatsDisplayProps) {
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

    return (
        <div className={cn('space-y-6', className)}>
            {/* Map Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.map((map, index) => (
                    <Card
                        key={map.map_id || map.map_name}
                        className="overflow-hidden hover:shadow-lg transition-all group"
                    >
                        {/* Map Image Header */}
                        <div className="relative h-32 bg-gradient-to-br from-red-900/50 to-gray-900 overflow-hidden">
                            {map.splash_image_url ? (
                                <Image
                                    src={map.splash_image_url}
                                    alt={map.map_name}
                                    fill
                                    className="object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Map className="w-12 h-12 text-muted-foreground/30" />
                                </div>
                            )}

                            {/* Map Name Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-bold text-lg">{map.map_name}</h3>
                                    <Badge
                                        variant="secondary"
                                        className="bg-white/20 text-white border-0"
                                    >
                                        #{index + 1}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-4">
                            {/* Pick/Ban Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {/* Pick Rate */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <TrendingUp className="w-3 h-3" />
                                        <span>Pick Rate</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-green-500">
                                            {map.pick_rate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                                            style={{ width: `${(map.pick_rate / maxPickRate) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Ban Rate */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Ban className="w-3 h-3" />
                                        <span>Ban Rate</span>
                                    </div>
                                    <div className="flex items-end gap-2">
                                        <span className="text-2xl font-bold text-red-500">
                                            {map.ban_rate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                                            style={{ width: `${(map.ban_rate / maxBanRate) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Attack/Defense Win Rate */}
                            <div className="pt-4 border-t border-border">
                                <p className="text-xs text-muted-foreground mb-2">Side Win Rate</p>
                                <div className="flex items-center gap-2">
                                    {/* Attack Side */}
                                    <div className="flex-1">
                                        <div className="h-6 bg-muted rounded-l-full overflow-hidden relative">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-end pr-2"
                                                style={{ width: `${map.attack_win_rate}%` }}
                                            >
                                                <span className="text-xs font-semibold text-white">
                                                    {map.attack_win_rate.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-center text-muted-foreground mt-1">Attack</p>
                                    </div>

                                    {/* Defense Side */}
                                    <div className="flex-1">
                                        <div className="h-6 bg-muted rounded-r-full overflow-hidden relative">
                                            <div
                                                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 flex items-center pl-2"
                                                style={{ width: `${map.defense_win_rate}%` }}
                                            >
                                                <span className="text-xs font-semibold text-white">
                                                    {map.defense_win_rate.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-center text-muted-foreground mt-1">Defense</p>
                                    </div>
                                </div>
                            </div>

                            {/* Games Played */}
                            <div className="mt-4 text-center">
                                <span className="text-xs text-muted-foreground">
                                    {map.total_games} games played
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
