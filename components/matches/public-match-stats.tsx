'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Game } from '@/lib/types/matches';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, BarChart3, Star } from 'lucide-react';
import { getValorantStatsByGameId } from '@/actions/stats-valorant';
import { getMlbbStatsByGameId } from '@/actions/stats-mlbb';
import Image from 'next/image';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface PublicMatchStatsProps {
  games: Game[];
  sport: 'Valorant' | 'Mobile Legends: Bang Bang' | string;
}

export function PublicMatchStats({ games, sport }: PublicMatchStatsProps) {
  const [activeGameId, setActiveGameId] = useState<string>(games[0]?.id.toString());

  // Sort games by sequence
  const sortedGames = [...games].sort((a, b) => a.game_number - b.game_number);

  if (games.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground/60 text-sm">
        No games recorded for this match yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={sortedGames[0]?.id.toString()} onValueChange={setActiveGameId}>
        <TabsList className="w-full justify-start overflow-x-auto bg-muted/30 rounded-xl p-1">
          {sortedGames.map((game) => (
            <TabsTrigger key={game.id} value={game.id.toString()} className="rounded-lg text-xs sm:text-sm font-medium">
              Game {game.game_number}
            </TabsTrigger>
          ))}
        </TabsList>

        {sortedGames.map((game) => (
          <TabsContent key={game.id} value={game.id.toString()}>
            <GameStatsViewer gameId={game.id} sport={sport} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function GameStatsViewer({ gameId, sport }: { gameId: number; sport: string }) {
  const isValorant = sport === 'Valorant';
  const isMlbb = sport === 'Mobile Legends: Bang Bang';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['game-stats', gameId, sport],
    queryFn: async () => {
      if (isValorant) {
        const res = await getValorantStatsByGameId(gameId);
        if (!res.success) throw new Error(res.error);
        return res.data;
      } else if (isMlbb) {
        const res = await getMlbbStatsByGameId(gameId);
        if (!res.success) throw new Error(res.error);
        return res.data;
      }
      return [];
    },
    enabled: !!gameId && (isValorant || isMlbb),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground/60 text-sm">
        No statistics available for this game.
      </div>
    );
  }

  // Group by team
  const teams = Array.from(new Set(stats.map((s: any) => s.schools_teams?.id))).filter(Boolean);

  // Find the overall MVP for this game (highest rating for MLBB, highest ACS for Valorant)
  const mvpPlayer = stats.reduce((best: any, current: any) => {
    if (current.is_mvp) return current;
    if (best?.is_mvp) return best;
    // Fallback: highest rating (MLBB) or highest ACS (Valorant)
    if (isMlbb) {
      return (!best || (current.rating || 0) > (best.rating || 0)) ? current : best;
    }
    if (isValorant) {
      return (!best || (current.acs || 0) > (best.acs || 0)) ? current : best;
    }
    return best;
  }, null);

  // Heatmap helper
  const getHeatmap = (value: number, allValues: number[], invertColors = false) => {
    const max = Math.max(...allValues);
    if (max === 0 || value === 0) return {};
    const ratio = value / max;
    if (invertColors) {
      if (ratio > 0.8) return { backgroundColor: 'rgba(239, 68, 68, 0.15)' };
      return {};
    }
    if (ratio >= 0.9) return { backgroundColor: 'rgba(16, 185, 129, 0.2)' };
    if (ratio >= 0.7) return { backgroundColor: 'rgba(59, 130, 246, 0.15)' };
    if (ratio >= 0.5) return { backgroundColor: 'rgba(59, 130, 246, 0.05)' };
    return {};
  };

  return (
    <div className="space-y-6 mt-4">
      {/* MVP highlight */}
      {mvpPlayer && (mvpPlayer.is_mvp || isMlbb) && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
          <div className="p-2 rounded-lg bg-yellow-500/10">
            <Trophy className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {mvpPlayer.game_characters?.icon_url && (
              <Image
                src={mvpPlayer.game_characters.icon_url}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover border border-yellow-500/30"
              />
            )}
            <div>
              <div className="text-sm font-bold text-yellow-500">
                {mvpPlayer.is_mvp ? 'MVP' : 'Top Performer'} — {mvpPlayer.players?.ign || 'Unknown'}
              </div>
              <div className="text-[10px] text-muted-foreground/50">
                {mvpPlayer.schools_teams?.schools?.abbreviation || mvpPlayer.schools_teams?.name}
                {' · '}
                {isMlbb && `${mvpPlayer.kills || 0}/${mvpPlayer.deaths || 0}/${mvpPlayer.assists || 0} · Rating: ${(mvpPlayer.rating || 0).toFixed(1)}`}
                {isValorant && `${mvpPlayer.kills || 0}/${mvpPlayer.deaths || 0}/${mvpPlayer.assists || 0} · ACS: ${mvpPlayer.acs || 0}`}
              </div>
            </div>
          </div>
        </div>
      )}

      {teams.map((teamId) => {
        const teamStats = stats.filter((s: any) => s.schools_teams?.id === teamId);
        const teamInfo = teamStats[0]?.schools_teams;
        if (!teamInfo) return null;

        // Sort by rating (MLBB) or ACS (Valorant), descending
        const sorted = [...teamStats].sort((a: any, b: any) => {
          if (isMlbb) return (b.rating || 0) - (a.rating || 0);
          if (isValorant) return (b.acs || 0) - (a.acs || 0);
          return 0;
        });

        return (
          <div key={teamId} className="space-y-0">
            {/* Team header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/20 rounded-t-xl border border-border/30 border-b-0">
              <Image
                src={teamInfo.schools?.logo_url || '/img/cesafi-logo.webp'}
                alt={teamInfo.name}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover border border-border/40"
              />
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  {teamInfo.schools?.abbreviation || teamInfo.name}
                </h3>
                <p className="text-[10px] text-muted-foreground/50">{teamInfo.schools?.name}</p>
              </div>
            </div>

            {/* Stats Table */}
            <div className="rounded-b-xl border border-border/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-max min-w-full caption-bottom text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50 text-left">
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 px-4 h-10 text-left min-w-[180px]">Player</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 px-3 h-10 text-left min-w-[120px]">
                        {isMlbb ? 'Hero' : 'Agent'}
                      </th>
                      {isValorant && (
                        <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[55px]">ACS</th>
                      )}
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[45px]">K</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[45px]">D</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[45px]">A</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[55px]">KDA</th>
                      {isMlbb && (
                        <>
                          <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[65px]">Gold</th>
                          <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[55px]">DMG</th>
                          <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[55px]">Rating</th>
                        </>
                      )}
                      {isValorant && (
                        <>
                          <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[45px]">FB</th>
                          <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[45px]">P</th>
                          <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[45px]">D</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((stat: any, i: number) => {
                      const kda = (stat.deaths || 0) > 0
                        ? ((stat.kills || 0) + (stat.assists || 0)) / (stat.deaths || 1)
                        : (stat.kills || 0) + (stat.assists || 0);
                      const isMvp = stat.is_mvp || stat.id === mvpPlayer?.id;
                      const charIcon = stat.game_characters?.icon_url;
                      const charName = stat.game_characters?.name || (isMlbb ? stat.hero_name : stat.agent_name) || '—';

                      return (
                        <tr
                          key={stat.id}
                          className={cn(
                            'group hover:bg-muted/20 border-b border-border/20 transition-colors h-[52px]',
                            isMvp && 'bg-yellow-500/5'
                          )}
                        >
                          {/* Player */}
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">
                                {stat.players?.ign || 'Unknown'}
                              </span>
                              {isMvp && (
                                <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 text-[9px] px-1.5 py-0">
                                  <Star className="h-2.5 w-2.5 mr-0.5 fill-yellow-500" />MVP
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Hero/Agent with icon */}
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {charIcon ? (
                                <Image
                                  src={charIcon}
                                  alt={charName}
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 rounded-md object-cover border border-border/30"
                                />
                              ) : (
                                <div className="h-6 w-6 rounded-md bg-muted/50 border border-border/30 flex items-center justify-center">
                                  <span className="text-[8px] text-muted-foreground/40 font-bold">
                                    {charName.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs text-muted-foreground font-medium truncate max-w-[80px]">
                                {charName}
                              </span>
                            </div>
                          </td>

                          {/* ACS (Valorant) */}
                          {isValorant && (
                            <td className="p-0 h-full border-l border-border/10">
                              <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                                style={getHeatmap(stat.acs || 0, sorted.map((s: any) => s.acs || 0))}
                              >
                                <span className="text-xs font-bold tabular-nums text-foreground">{stat.acs || 0}</span>
                              </div>
                            </td>
                          )}

                          {/* K */}
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getHeatmap(stat.kills || 0, sorted.map((s: any) => s.kills || 0))}
                            >
                              <span className="text-xs font-medium text-green-400 tabular-nums">{stat.kills || 0}</span>
                            </div>
                          </td>

                          {/* D */}
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getHeatmap(stat.deaths || 0, sorted.map((s: any) => s.deaths || 0), true)}
                            >
                              <span className="text-xs font-medium text-red-400 tabular-nums">{stat.deaths || 0}</span>
                            </div>
                          </td>

                          {/* A */}
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getHeatmap(stat.assists || 0, sorted.map((s: any) => s.assists || 0))}
                            >
                              <span className="text-xs font-medium text-blue-400 tabular-nums">{stat.assists || 0}</span>
                            </div>
                          </td>

                          {/* KDA */}
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getHeatmap(kda, sorted.map((s: any) => {
                                const d = s.deaths || 1;
                                return ((s.kills || 0) + (s.assists || 0)) / d;
                              }))}
                            >
                              <span className="text-xs font-bold tabular-nums text-foreground">{kda.toFixed(2)}</span>
                            </div>
                          </td>

                          {/* MLBB extra columns */}
                          {isMlbb && (
                            <>
                              {/* Gold */}
                              <td className="p-0 h-full border-l border-border/10">
                                <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                                  style={getHeatmap(stat.gold || 0, sorted.map((s: any) => s.gold || 0))}
                                >
                                  <span className="text-xs font-medium text-yellow-400 tabular-nums">
                                    {(stat.gold || 0).toLocaleString()}
                                  </span>
                                </div>
                              </td>
                              {/* Damage Dealt */}
                              <td className="text-center px-3 py-2">
                                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                  {stat.damage_dealt ? (stat.damage_dealt / 1000).toFixed(1) + 'k' : '—'}
                                </span>
                              </td>
                              {/* Rating */}
                              <td className="p-0 h-full border-l border-border/10">
                                <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                                  style={getHeatmap(stat.rating || 0, sorted.map((s: any) => s.rating || 0))}
                                >
                                  <span className={cn(
                                    'text-xs font-bold tabular-nums',
                                    (stat.rating || 0) >= 8 ? 'text-yellow-400' : (stat.rating || 0) >= 6 ? 'text-foreground' : 'text-muted-foreground'
                                  )}>
                                    {stat.rating ? stat.rating.toFixed(1) : '—'}
                                  </span>
                                </div>
                              </td>
                            </>
                          )}

                          {/* Valorant extra columns */}
                          {isValorant && (
                            <>
                              {/* First Bloods */}
                              <td className="text-center px-3 py-2">
                                <span className="text-xs font-medium text-orange-400 tabular-nums">{stat.first_bloods || 0}</span>
                              </td>
                              {/* Plants */}
                              <td className="text-center px-3 py-2">
                                <span className="text-xs font-medium text-muted-foreground tabular-nums">{stat.plants || 0}</span>
                              </td>
                              {/* Defuses */}
                              <td className="text-center px-3 py-2">
                                <span className="text-xs font-medium text-muted-foreground tabular-nums">{stat.defuses || 0}</span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
