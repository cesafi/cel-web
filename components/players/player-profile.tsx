'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { usePlayerByIgnAndSchool, usePlayerBySlug } from '@/hooks/use-players';
import { usePlayerSeasonsByPlayerId } from '@/hooks/use-player-seasons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Users,
  Trophy,
  Target,
  Crosshair,
  Gamepad2,
  Shield,
  Swords,
  Star,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMlbbStats, getValorantStats, getPlayerCharacterStats } from '@/actions/statistics';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface PlayerProfileProps {
  schoolSlug?: string;
  playerIGN: string;
}

export default function PlayerProfile({ schoolSlug, playerIGN }: PlayerProfileProps) {
  const router = useRouter();
  const byIgnAndSchool = usePlayerByIgnAndSchool(playerIGN, schoolSlug || '', {
    enabled: !!schoolSlug,
  } as any);
  const bySlug = usePlayerBySlug(playerIGN, {
    enabled: !schoolSlug,
  } as any);
  const { data: player, isLoading: playerLoading, error: playerError } = schoolSlug ? byIgnAndSchool : bySlug;
  const playerId = player?.id || '';
  const { data: playerSeasons } = usePlayerSeasonsByPlayerId(playerId);

  // Determine team context from player_seasons
  const currentTeam = React.useMemo(() => {
    if (!playerSeasons || playerSeasons.length === 0) return null;
    const sorted = [...playerSeasons].sort((a: any, b: any) => {
      const aDate = a.schools_teams?.seasons?.start_at || '0';
      const bDate = b.schools_teams?.seasons?.start_at || '0';
      return bDate.localeCompare(aDate);
    });
    return sorted[0];
  }, [playerSeasons]);

  const schoolInfo = currentTeam?.schools_teams?.schools || (player as any)?.schools_teams?.schools;
  const teamName = currentTeam?.schools_teams?.name || (player as any)?.schools_teams?.name;

  // Detect game type
  const [detectedGame, setDetectedGame] = React.useState<'mlbb' | 'valorant' | null>(null);

  // Fetch MLBB stats for this player
  const { data: mlbbStats } = useQuery({
    queryKey: ['player-mlbb-stats', playerId],
    queryFn: async () => {
      const result = await getMlbbStats({ search_query: player?.ign || '' });
      if (!result.success) return [];
      return ((result.data as any[]) || []).filter((s: any) => s.player_id === playerId);
    },
    enabled: !!player?.ign,
  });

  // Fetch Valorant stats for this player
  const { data: valorantStats } = useQuery({
    queryKey: ['player-valorant-stats', playerId],
    queryFn: async () => {
      const result = await getValorantStats({ search_query: player?.ign || '' });
      if (!result.success) return [];
      return ((result.data as any[]) || []).filter((s: any) => s.player_id === playerId);
    },
    enabled: !!player?.ign,
  });

  // Determine game from stats
  React.useEffect(() => {
    if (mlbbStats && mlbbStats.length > 0) setDetectedGame('mlbb');
    else if (valorantStats && valorantStats.length > 0) setDetectedGame('valorant');
  }, [mlbbStats, valorantStats]);

  const playerStat = detectedGame === 'mlbb'
    ? mlbbStats?.[0]
    : detectedGame === 'valorant'
      ? valorantStats?.[0]
      : null;

  const isMlbb = detectedGame === 'mlbb';
  const isValorant = detectedGame === 'valorant';

  // Per-player character stats (hero/agent) — from raw game tables
  const { data: characterStats } = useQuery({
    queryKey: ['player-character-stats', playerId, detectedGame],
    queryFn: async () => {
      if (!detectedGame) return [];
      const result = await getPlayerCharacterStats(playerId, detectedGame);
      if (!result.success) return [];
      return result.data || [];
    },
    enabled: !!detectedGame && !!playerId,
  });

  // Loading
  if (playerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative w-full h-[40vh] min-h-[300px] bg-muted/30 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-muted/30" />)}
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (playerError || !player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <Users className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Player Not Found</h1>
          <p className="text-muted-foreground">This player doesn&apos;t exist or has been removed.</p>
          <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const kda = playerStat
    ? (playerStat.total_deaths > 0
      ? ((playerStat.total_kills + playerStat.total_assists) / playerStat.total_deaths).toFixed(2)
      : 'Perfect')
    : '-';

  // Heatmap helper for character stats
  const getCharHeatmap = (value: number, allValues: number[], invertColors = false) => {
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

  const charStatsArray = (characterStats as any[]) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full h-[50vh] min-h-[400px] overflow-hidden bg-zinc-950"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/img/cclex-banner.webp')] bg-cover bg-center bg-no-repeat" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        <div className="absolute top-6 left-6 z-10">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="backdrop-blur-sm bg-black/20 hover:bg-black/40 text-white border-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
          </Button>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-full w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-full items-end justify-between">
            {/* Player Info (Left Side) */}
            <div className="pb-8 md:pb-12 text-white relative z-20 max-w-2xl">
              <h1 className="font-mango-grotesque text-6xl md:text-8xl lg:text-9xl font-bold tracking-wide leading-none drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                {player.ign}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {player.first_name && (
                  <span className="text-lg md:text-xl font-medium text-white/90 drop-shadow-md">
                    {player.first_name} {player.last_name}
                  </span>
                )}
                {player.role && (
                  <Badge variant="outline" className="border-white/30 bg-black/20 backdrop-blur-sm text-white px-3 py-1 text-xs uppercase tracking-[0.2em] shadow-lg">
                    {player.role}
                  </Badge>
                )}
                {teamName && (
                  <span className="text-lg md:text-xl font-medium text-primary-400 drop-shadow-md">
                    {teamName}
                  </span>
                )}
              </div>
              
              {schoolInfo && (
                <div className="flex items-center gap-3 mt-4">
                  {schoolInfo.logo_url && (
                    <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
                      <Image 
                        src={schoolInfo.logo_url} 
                        alt={schoolInfo.name} 
                        width={32} 
                        height={32} 
                        className="h-8 w-8 object-contain drop-shadow-lg" 
                      />
                    </div>
                  )}
                  <span className="text-sm md:text-base font-medium text-white/70 drop-shadow-sm">
                    {schoolInfo.name}
                  </span>
                </div>
              )}
            </div>

            {/* Player Photo (Right Side, Overlapping) */}
            <div className="relative h-full w-1/2 max-w-[500px] hidden md:block">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150 translate-y-20" />
              {((player as any).photo_url_secondary || player.photo_url) ? (
                <Image 
                  src={(player as any).photo_url_secondary || player.photo_url} 
                  alt={player.ign} 
                  fill 
                  className="relative z-10 object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                  priority
                />
              ) : (
                <div className="relative z-10 h-full w-full flex items-end justify-center pb-8">
                  <div className="h-48 w-48 rounded-full bg-muted/40 backdrop-blur-sm border-2 border-white/10 flex items-center justify-center shadow-2xl">
                     <span className="text-6xl font-mango-grotesque font-bold text-white/50">{player.ign?.charAt(0) || '?'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Player Photo Overlay */}
        <div className="absolute bottom-0 right-4 h-2/3 w-1/2 md:hidden">
          {((player as any).photo_url_secondary || player.photo_url) && (
            <Image 
              src={(player as any).photo_url_secondary || player.photo_url} 
              alt={player.ign} 
              fill 
              className="object-contain object-bottom opacity-50 drop-shadow-[0_0_15px_rgba(0,0,0,0.8)] mask-image-b-fade"
              priority
            />
          )}
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Career Stats Summary */}
        {playerStat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 py-8"
          >
            {[
              { label: 'Games', value: playerStat.games_played || 0, icon: Gamepad2 },
              { label: 'KDA', value: kda, icon: Target },
              { label: 'Kills', value: playerStat.total_kills || 0, icon: Crosshair },
              { label: 'MVPs', value: playerStat.mvp_count || 0, icon: Trophy },
              ...(isMlbb
                ? [{ label: 'Rating', value: playerStat.avg_rating != null ? Number(playerStat.avg_rating).toFixed(2) : '-', icon: Star }]
                : isValorant
                  ? [{ label: 'ACS', value: Math.round(playerStat.avg_acs || 0), icon: Shield }]
                  : [{ label: 'Wins', value: playerStat.wins || 0, icon: Trophy }]
              ),
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-3 sm:p-4 text-center shadow-lg">
                <stat.icon className="h-4 w-4 text-muted-foreground/40 mx-auto mb-2" />
                <div className="font-mango-grotesque text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-none">{stat.value}</div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Detailed Stats */}
        {playerStat && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="py-6"
          >
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Target className="h-4 w-4" />
                </div>
                <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Detailed Statistics</h3>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: 'Total Kills', value: playerStat.total_kills, color: 'text-green-400' },
                    { label: 'Total Deaths', value: playerStat.total_deaths, color: 'text-red-400' },
                    { label: 'Total Assists', value: playerStat.total_assists, color: 'text-blue-400' },
                    { label: 'K/G', value: playerStat.kills_per_game?.toFixed(1), color: 'text-foreground' },
                    { label: 'D/G', value: playerStat.deaths_per_game?.toFixed(1), color: 'text-foreground' },
                    { label: 'A/G', value: playerStat.assists_per_game?.toFixed(1), color: 'text-foreground' },
                    ...(isMlbb ? [
                      { label: 'Rating', value: playerStat.avg_rating != null ? Number(playerStat.avg_rating).toFixed(2) : '-', color: 'text-yellow-400' },
                      { label: 'Total Gold', value: Math.round(playerStat.total_gold || 0).toLocaleString(), color: 'text-yellow-400' },
                      { label: 'GPM', value: Math.round(playerStat.avg_gpm || 0), color: 'text-yellow-400' },
                      { label: 'Damage Dealt', value: Math.round(playerStat.total_damage_dealt || 0).toLocaleString(), color: 'text-orange-400' },
                      { label: 'Damage Taken', value: Math.round(playerStat.total_damage_taken || 0).toLocaleString(), color: 'text-orange-400' },
                      { label: 'Turret Damage', value: Math.round(playerStat.total_turret_damage || 0).toLocaleString(), color: 'text-purple-400' },
                    ] : []),
                    ...(isValorant ? [
                      { label: 'Avg ACS', value: Math.round(playerStat.avg_acs || 0), color: 'text-foreground' },
                      { label: 'First Bloods', value: playerStat.total_first_bloods || 0, color: 'text-orange-400' },
                      { label: 'Plants', value: playerStat.total_plants || 0, color: 'text-green-400' },
                      { label: 'Defuses', value: playerStat.total_defuses || 0, color: 'text-blue-400' },
                    ] : []),
                  ].map((item, i) => (
                    <div key={i} className="rounded-xl bg-background/40 border border-border/30 p-3 sm:p-4">
                      <div className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">{item.label}</div>
                      <div className={cn('text-base sm:text-lg font-bold tabular-nums', item.color)}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Per-Player Character Stats (Hero/Agent) */}
        {charStatsArray.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="py-6"
          >
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
                <div className={cn(
                  'p-2 rounded-lg',
                  isMlbb ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'
                )}>
                  {isMlbb ? <Shield className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />}
                </div>
                <div>
                  <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">
                    {isMlbb ? 'Hero' : 'Agent'} Performance
                  </h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Showing {charStatsArray.length} {isMlbb ? 'heroes' : 'agents'} played
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-max min-w-full caption-bottom text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50 text-left">
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 px-4 h-10 text-left min-w-[160px]">
                        {isMlbb ? 'Hero' : 'Agent'}
                      </th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">G</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">K</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">D</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">A</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[70px]">KDA</th>
                      {isMlbb && <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[80px]">Gold</th>}
                      {isMlbb && <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[70px]">RTG</th>}
                      {isValorant && <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[70px]">ACS</th>}
                      {isValorant && <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[70px]">FB/G</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {charStatsArray.map((char: any, i: number) => (
                      <tr key={char.character_id || i} className="group hover:bg-muted/20 border-b border-border/30 transition-colors h-[52px]">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            {char.icon_url ? (
                              <Image
                                src={char.icon_url}
                                alt={char.character_name}
                                width={32}
                                height={32}
                                className="h-8 w-8 rounded-lg object-cover border border-border/30"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-lg bg-muted/50 border border-border/30 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-muted-foreground/40">
                                  {char.character_name?.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{char.character_name}</span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-2">
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground tabular-nums">{char.games_played}</span>
                          </div>
                        </td>
                        <td className="p-0 h-full border-l border-border/10">
                          <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                            style={getCharHeatmap(char.avg_kills || 0, charStatsArray.map((c: any) => c.avg_kills || 0))}
                          >
                            <span className="text-xs font-medium text-green-400 tabular-nums">{char.avg_kills?.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="p-0 h-full border-l border-border/10">
                          <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                            style={getCharHeatmap(char.avg_deaths || 0, charStatsArray.map((c: any) => c.avg_deaths || 0), true)}
                          >
                            <span className="text-xs font-medium text-red-400 tabular-nums">{char.avg_deaths?.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="p-0 h-full border-l border-border/10">
                          <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                            style={getCharHeatmap(char.avg_assists || 0, charStatsArray.map((c: any) => c.avg_assists || 0))}
                          >
                            <span className="text-xs font-medium text-blue-400 tabular-nums">{char.avg_assists?.toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="p-0 h-full border-l border-border/10">
                          <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                            style={getCharHeatmap(char.avg_kda || 0, charStatsArray.map((c: any) => c.avg_kda || 0))}
                          >
                            <span className="text-xs font-bold tabular-nums text-foreground">{char.avg_kda?.toFixed(2)}</span>
                          </div>
                        </td>
                        {isMlbb && (
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getCharHeatmap(char.avg_gold || 0, charStatsArray.map((c: any) => c.avg_gold || 0))}
                            >
                              <span className="text-xs font-medium text-yellow-400 tabular-nums">{Math.round(char.avg_gold || 0).toLocaleString()}</span>
                            </div>
                          </td>
                        )}
                        {isMlbb && (
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getCharHeatmap(char.avg_rating || 0, charStatsArray.map((c: any) => c.avg_rating || 0))}
                            >
                              <span className="text-xs font-bold tabular-nums text-yellow-400">{char.avg_rating?.toFixed(2)}</span>
                            </div>
                          </td>
                        )}
                        {isValorant && (
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getCharHeatmap(char.avg_acs || 0, charStatsArray.map((c: any) => c.avg_acs || 0))}
                            >
                              <span className="text-xs font-medium text-foreground tabular-nums">{Math.round(char.avg_acs || 0)}</span>
                            </div>
                          </td>
                        )}
                        {isValorant && (
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getCharHeatmap(char.avg_first_bloods || 0, charStatsArray.map((c: any) => c.avg_first_bloods || 0))}
                            >
                              <span className="text-xs font-medium text-orange-400 tabular-nums">{char.avg_first_bloods?.toFixed(1)}</span>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {/* Season History */}
        {playerSeasons && playerSeasons.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="py-6 pb-16"
          >
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Gamepad2 className="h-4 w-4" />
                </div>
                <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Season History</h3>
              </div>

              <div className="divide-y divide-border/20">
                {(playerSeasons as any[]).map((ps: any, i: number) => {
                  const seasonName = ps.schools_teams?.seasons?.name || `Season ${ps.schools_teams?.seasons?.id || ''}`;
                  const esportName = ps.schools_teams?.esports_categories?.esports?.name || '';

                  return (
                    <div key={ps.id || i} className="px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {ps.schools_teams?.schools?.logo_url && (
                          <div className="relative w-8 h-8 flex-shrink-0">
                            <Image src={ps.schools_teams.schools.logo_url} alt="" fill className="rounded-full object-cover border border-border/30" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-foreground truncate">{ps.schools_teams?.name || 'Team'}</div>
                          <div className="text-xs text-muted-foreground/50 truncate">{ps.schools_teams?.schools?.abbreviation || ''}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                        <span className="text-xs font-semibold text-foreground/80">{seasonName}</span>
                        {esportName && (
                          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{esportName}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
