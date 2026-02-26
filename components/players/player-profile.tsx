'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePlayerById } from '@/hooks/use-players';
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
  playerId: string;
}

export default function PlayerProfile({ playerId }: PlayerProfileProps) {
  const { data: player, isLoading: playerLoading, error: playerError } = usePlayerById(playerId);
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
          <Button asChild>
            <Link href="/players">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Players
            </Link>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full h-[40vh] min-h-[300px] overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/img/cclex-banner.webp')] bg-cover bg-center bg-no-repeat" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        </div>

        <div className="absolute top-6 left-6 z-10">
          <Button variant="ghost" size="sm" asChild className="backdrop-blur-sm bg-black/20 hover:bg-black/40 text-white border-white/20">
            <Link href={schoolInfo ? `/schools/${schoolInfo.abbreviation}` : '/players'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {schoolInfo ? `Back to ${schoolInfo.abbreviation}` : 'Back to Players'}
            </Link>
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-6">
            <div className="relative h-24 w-24 md:h-32 md:w-32 flex-shrink-0">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-125" />
              {player.photo_url ? (
                <Image src={player.photo_url} alt={player.ign} fill className="relative z-10 rounded-full object-cover border-2 border-primary/40 shadow-2xl" />
              ) : (
                <div className="relative z-10 h-full w-full rounded-full bg-muted/50 border-2 border-border/40 flex items-center justify-center">
                  <span className="text-3xl font-bold text-muted-foreground/40">{player.ign?.charAt(0) || '?'}</span>
                </div>
              )}
            </div>

            <div className="text-white text-center md:text-left pb-2">
              <h1 className="font-mango-grotesque text-4xl md:text-5xl lg:text-6xl font-bold tracking-wide leading-none drop-shadow-lg">
                {player.ign}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 justify-center md:justify-start">
                {player.first_name && (
                  <span className="text-sm text-white/60">{player.first_name} {player.last_name}</span>
                )}
                {player.role && (
                  <Badge variant="outline" className="border-white/20 text-white/70 text-[10px] uppercase tracking-widest">
                    {player.role}
                  </Badge>
                )}
                {teamName && <span className="text-sm text-white/50">{teamName}</span>}
              </div>
              {schoolInfo && (
                <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                  {schoolInfo.logo_url && <Image src={schoolInfo.logo_url} alt="" width={20} height={20} className="h-5 w-5 object-contain" />}
                  <span className="text-xs text-white/40">{schoolInfo.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Career Stats Summary */}
        {playerStat && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-3 py-8"
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
              <div key={i} className="rounded-xl border border-border/40 bg-card/60 p-4 text-center">
                <stat.icon className="h-4 w-4 text-muted-foreground/40 mx-auto mb-2" />
                <div className="font-mango-grotesque text-2xl md:text-3xl font-bold text-foreground leading-none">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mt-1">{stat.label}</div>
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
            className="py-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Target className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Detailed Statistics</span>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/60 p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-8">
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
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground/60">{item.label}</span>
                    <span className={cn('text-sm font-medium', item.color)}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        <div className="h-px bg-border/20" />

        {/* Per-Player Character Stats (Hero/Agent) */}
        {characterStats && characterStats.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="py-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full border',
                isMlbb ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
              )}>
                {isMlbb ? <Shield className="w-3.5 h-3.5" /> : <Crosshair className="w-3.5 h-3.5" />}
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {isMlbb ? 'Hero' : 'Agent'} Performance
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      <th className="text-left px-4 py-3 font-medium">{isMlbb ? 'Hero' : 'Agent'}</th>
                      <th className="text-center px-3 py-3 font-medium">Games</th>
                      <th className="text-center px-3 py-3 font-medium">Avg K</th>
                      <th className="text-center px-3 py-3 font-medium">Avg D</th>
                      <th className="text-center px-3 py-3 font-medium">Avg A</th>
                      <th className="text-center px-3 py-3 font-medium">KDA</th>
                      {isMlbb && <th className="text-center px-3 py-3 font-medium">Avg Gold</th>}
                      {isMlbb && <th className="text-center px-3 py-3 font-medium">Rating</th>}
                      {isValorant && <th className="text-center px-3 py-3 font-medium">ACS</th>}
                      {isValorant && <th className="text-center px-3 py-3 font-medium">FB/G</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(characterStats as any[]).map((char: any, i: number) => (
                      <tr key={char.character_id || i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {char.icon_url ? (
                              <Image
                                src={char.icon_url}
                                alt={char.character_name}
                                width={28}
                                height={28}
                                className="h-7 w-7 rounded-md object-cover border border-border/30"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-md bg-muted/50 border border-border/30 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-muted-foreground/40">
                                  {char.character_name?.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-foreground">{char.character_name}</span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-3 text-muted-foreground">{char.games_played}</td>
                        <td className="text-center px-3 py-3 text-green-400">{char.avg_kills?.toFixed(1)}</td>
                        <td className="text-center px-3 py-3 text-red-400">{char.avg_deaths?.toFixed(1)}</td>
                        <td className="text-center px-3 py-3 text-blue-400">{char.avg_assists?.toFixed(1)}</td>
                        <td className="text-center px-3 py-3 font-medium text-foreground">{char.avg_kda?.toFixed(2)}</td>
                        {isMlbb && <td className="text-center px-3 py-3 text-yellow-400">{Math.round(char.avg_gold || 0)}</td>}
                        {isMlbb && <td className="text-center px-3 py-3 text-yellow-400">{char.avg_rating?.toFixed(2)}</td>}
                        {isValorant && <td className="text-center px-3 py-3 text-foreground">{Math.round(char.avg_acs || 0)}</td>}
                        {isValorant && <td className="text-center px-3 py-3 text-orange-400">{char.avg_first_bloods?.toFixed(1)}</td>}
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
            className="py-8 pb-16"
          >
            <div className="h-px bg-border/20 mb-8" />
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Season History</span>
              </div>
            </div>

            <div className="space-y-2">
              {(playerSeasons as any[]).map((ps: any, i: number) => (
                <div key={ps.id || i} className="rounded-xl border border-border/40 bg-card/60 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {ps.schools_teams?.schools?.logo_url && (
                      <Image src={ps.schools_teams.schools.logo_url} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
                    )}
                    <div>
                      <span className="text-sm font-medium text-foreground">{ps.schools_teams?.name || 'Team'}</span>
                      <span className="text-xs text-muted-foreground/50 ml-2">{ps.schools_teams?.schools?.abbreviation || ''}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground/40">
                    {ps.schools_teams?.seasons?.start_at ? new Date(ps.schools_teams.seasons.start_at).getFullYear() : ''}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
