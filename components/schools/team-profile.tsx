'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSchoolByAbbreviation } from '@/hooks/use-schools';
import { useSchoolsTeamBySlug } from '@/hooks/use-schools-teams';
import { usePlayersByTeamId } from '@/hooks/use-players';
import { useMatchesBySchoolId } from '@/hooks/use-matches';
import { MatchWithFullDetails } from '@/lib/types/matches';
import { Player } from '@/lib/types/players';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ChevronRight,
  Trophy,
  Users,
  Swords,
  Gamepad2,
  Target,
  Crosshair,
  Shield,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMlbbStats, getValorantStats, getHeroStats, getAgentStats, getMapStats } from '@/actions/statistics';
import { toPlayerSlug } from '@/lib/utils/player-slug';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface TeamProfileProps {
  schoolAbbreviation: string;
  teamSlug: string;
}

export default function TeamProfile({ schoolAbbreviation, teamSlug }: TeamProfileProps) {
  const router = useRouter();
  const { data: school, isLoading: schoolLoading } = useSchoolByAbbreviation(schoolAbbreviation);
  const { data: team, isLoading: teamLoading } = useSchoolsTeamBySlug(teamSlug, schoolAbbreviation);
  const teamId = (team as any)?.id || '';
  const { data: players, isLoading: playersLoading } = usePlayersByTeamId(teamId);

  // Determine the esport
  const esportName = (team as any)?.esports_categories?.esports?.name || '';
  const isMlbb = esportName.toLowerCase().includes('mlbb') || esportName.toLowerCase().includes('mobile legends');
  const isValorant = esportName.toLowerCase().includes('valorant');
  const seasonId = (team as any)?.season_id;

  // Fetch player stats for this team
  const { data: mlbbStats } = useQuery({
    queryKey: ['team-stats-mlbb', teamId, seasonId],
    queryFn: async () => {
      const result = await getMlbbStats({ team_id: teamId, season_id: seasonId });
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: isMlbb && !!teamId,
  });

  const { data: valorantStats } = useQuery({
    queryKey: ['team-stats-valorant', teamId, seasonId],
    queryFn: async () => {
      const result = await getValorantStats({ team_id: teamId, season_id: seasonId });
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: isValorant && !!teamId,
  });

  // Hero stats for MLBB
  const { data: heroStats } = useQuery({
    queryKey: ['team-hero-stats', teamId, seasonId],
    queryFn: async () => {
      const result = await getHeroStats(seasonId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: isMlbb && !!seasonId,
  });

  // Agent stats for Valorant
  const { data: agentStats } = useQuery({
    queryKey: ['team-agent-stats', teamId, seasonId],
    queryFn: async () => {
      const result = await getAgentStats(seasonId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: isValorant && !!seasonId,
  });

  // Map stats for Valorant
  const { data: mapStats } = useQuery({
    queryKey: ['team-map-stats', seasonId],
    queryFn: async () => {
      const result = await getMapStats(seasonId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: isValorant && !!seasonId,
  });

  // Recent matches
  const { data: recentMatches, isLoading: matchesLoading } = useMatchesBySchoolId(school?.id || '', {
    limit: 5,
    season_id: seasonId,
    direction: 'past'
  });

  const playerStats = isMlbb ? mlbbStats : valorantStats;

  // Compute team summary from player stats
  const teamSummary = React.useMemo(() => {
    if (!playerStats || playerStats.length === 0) return null;
    const totalGames = Math.max(...playerStats.map((p: any) => p.games_played || 0), 0);
    const totalKills = playerStats.reduce((s: number, p: any) => s + (p.total_kills || 0), 0);
    const totalDeaths = playerStats.reduce((s: number, p: any) => s + (p.total_deaths || 0), 0);
    const totalAssists = playerStats.reduce((s: number, p: any) => s + (p.total_assists || 0), 0);
    const totalWins = Math.max(...playerStats.map((p: any) => p.wins || 0), 0);
    const kda = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : 'Perfect';
    return { totalGames, totalKills, totalDeaths, totalAssists, totalWins, kda };
  }, [playerStats]);

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

  // Loading
  if (schoolLoading || teamLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative w-full h-[40vh] min-h-[300px] bg-muted/30 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          <Skeleton className="h-48 rounded-xl bg-muted/30" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-muted/30" />)}
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (!team || !school) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <Users className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Team Not Found</h1>
          <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getMatchStatus = (status: string) => {
    const configs: Record<string, { label: string; color: string; animate: boolean }> = {
      live: { label: 'LIVE', color: 'text-red-500', animate: true },
      finished: { label: 'FINAL', color: 'text-muted-foreground', animate: false },
      completed: { label: 'FINAL', color: 'text-muted-foreground', animate: false },
      upcoming: { label: 'UPCOMING', color: 'text-primary', animate: false },
    };
    return configs[status] || configs.upcoming;
  };

  const sortedPlayerStats = playerStats
    ? [...(playerStats as any[])].sort((a: any, b: any) => (b.total_kills + b.total_assists) - (a.total_kills + a.total_assists))
    : [];

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
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="backdrop-blur-sm bg-black/20 hover:bg-black/40 text-white border-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-end gap-5">
            <div className="relative h-20 w-20 md:h-28 md:w-28 flex-shrink-0">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-125" />
              <Image
                src={school.logo_url || '/img/cesafi-logo.webp'}
                alt={school.name}
                fill
                className="relative z-10 object-contain drop-shadow-2xl"
              />
            </div>
            <div className="text-white text-center md:text-left pb-2">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Badge variant="outline" className="border-white/20 text-white/70 text-[10px] uppercase tracking-widest">
                  {esportName || 'Esport'}
                </Badge>
              </div>
              <h1 className="font-mango-grotesque text-3xl md:text-5xl lg:text-6xl font-bold tracking-wide leading-none drop-shadow-lg">
                {(team as any).name}
              </h1>
              <p className="text-sm md:text-base text-white/60 mt-1">{school.name}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Team Stats Summary */}
        {teamSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 py-8"
          >
            {[
              { label: 'Games', value: teamSummary.totalGames, icon: Gamepad2 },
              { label: 'Wins', value: teamSummary.totalWins, icon: Trophy },
              { label: 'Team KDA', value: teamSummary.kda, icon: Target },
              { label: 'Total Kills', value: teamSummary.totalKills, icon: Crosshair },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-3 sm:p-4 text-center shadow-lg">
                <stat.icon className="h-4 w-4 text-muted-foreground/40 mx-auto mb-2" />
                <div className="font-mango-grotesque text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-none">
                  {stat.value}
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Roster */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Roster</h3>
            </div>

            <div className="p-4 sm:p-6">
              {playersLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-muted/30" />)}
                </div>
              ) : players && players.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {players.map((player: Player, index: number) => {
                    const pStat = (playerStats as any[])?.find((s: any) => s.player_id === player.id);
                    return (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link href={`/schools/${encodeURIComponent(schoolAbbreviation).toLowerCase()}/players/${toPlayerSlug(player.ign)}`} className="group block">
                          <div className="rounded-xl border border-border/30 bg-background/40 hover:border-border/60 hover:bg-muted/10 transition-all duration-300 p-4 text-center">
                            <div className="relative h-14 w-14 mx-auto mb-3">
                              {player.photo_url ? (
                                <Image src={player.photo_url} alt={player.ign} fill className="rounded-full object-cover border border-border/40" />
                              ) : (
                                <div className="h-full w-full rounded-full bg-muted/50 flex items-center justify-center border border-border/40">
                                  <span className="text-lg font-bold text-muted-foreground/40">{player.ign?.charAt(0) || '?'}</span>
                                </div>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                              {player.ign}
                            </h4>
                            {player.role && (
                              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mt-0.5">{player.role}</p>
                            )}
                            {pStat && (
                              <div className="mt-2 pt-2 border-t border-border/20">
                                <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                                  {pStat.total_kills || 0}/{pStat.total_deaths || 0}/{pStat.total_assists || 0} KDA
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground/60 text-sm">No roster data available for this team.</p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Player Stats Table */}
        {sortedPlayerStats.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Player Statistics</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{sortedPlayerStats.length} players</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-max min-w-full caption-bottom text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50 text-left">
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 px-4 h-10 text-left min-w-[140px]">Player</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[50px]">GP</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[50px]">K</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[50px]">D</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[50px]">A</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">KDA</th>
                      {isMlbb && <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[70px]">Gold</th>}
                      {isValorant && <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">ACS</th>}
                      {isValorant && <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[50px]">FB</th>}
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">MVP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPlayerStats.map((stat: any, i: number) => {
                      const kda = stat.total_deaths > 0 ? ((stat.total_kills + stat.total_assists) / stat.total_deaths).toFixed(2) : 'Perfect';
                      const kdaNum = stat.total_deaths > 0 ? (stat.total_kills + stat.total_assists) / stat.total_deaths : 99;
                      return (
                        <tr key={stat.player_id} className={cn('group hover:bg-muted/20 border-b border-border/30 transition-colors h-[52px]', i === 0 && 'bg-primary/5')}>
                          <td className="px-4 py-2">
                            <Link href={`/schools/${encodeURIComponent(schoolAbbreviation).toLowerCase()}/players/${toPlayerSlug(stat.player_ign || '')}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                              <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{stat.player_ign || 'Unknown'}</span>
                            </Link>
                          </td>
                          <td className="text-center px-3 py-2">
                            <span className="text-xs font-medium text-muted-foreground tabular-nums">{stat.games_played}</span>
                          </td>
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getHeatmap(stat.total_kills || 0, sortedPlayerStats.map((s: any) => s.total_kills || 0))}
                            >
                              <span className="text-xs font-medium text-green-400 tabular-nums">{stat.total_kills}</span>
                            </div>
                          </td>
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getHeatmap(stat.total_deaths || 0, sortedPlayerStats.map((s: any) => s.total_deaths || 0), true)}
                            >
                              <span className="text-xs font-medium text-red-400 tabular-nums">{stat.total_deaths}</span>
                            </div>
                          </td>
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getHeatmap(stat.total_assists || 0, sortedPlayerStats.map((s: any) => s.total_assists || 0))}
                            >
                              <span className="text-xs font-medium text-blue-400 tabular-nums">{stat.total_assists}</span>
                            </div>
                          </td>
                          <td className="p-0 h-full border-l border-border/10">
                            <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                              style={getHeatmap(kdaNum, sortedPlayerStats.map((s: any) => s.total_deaths > 0 ? (s.total_kills + s.total_assists) / s.total_deaths : 99))}
                            >
                              <span className="text-xs font-bold tabular-nums text-foreground">{kda}</span>
                            </div>
                          </td>
                          {isMlbb && (
                            <td className="p-0 h-full border-l border-border/10">
                              <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                                style={getHeatmap(stat.total_gold || 0, sortedPlayerStats.map((s: any) => s.total_gold || 0))}
                              >
                                <span className="text-xs font-medium text-yellow-400 tabular-nums">{Math.round(stat.total_gold || 0).toLocaleString()}</span>
                              </div>
                            </td>
                          )}
                          {isValorant && (
                            <td className="p-0 h-full border-l border-border/10">
                              <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                                style={getHeatmap(stat.avg_acs || 0, sortedPlayerStats.map((s: any) => s.avg_acs || 0))}
                              >
                                <span className="text-xs font-medium text-foreground tabular-nums">{Math.round(stat.avg_acs || 0)}</span>
                              </div>
                            </td>
                          )}
                          {isValorant && (
                            <td className="text-center px-3 py-2">
                              <span className="text-xs font-medium text-orange-400 tabular-nums">{stat.total_first_bloods || 0}</span>
                            </td>
                          )}
                          <td className="text-center px-3 py-2">
                            {stat.mvp_count > 0 && (
                              <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 text-[10px]">
                                <Trophy className="h-2.5 w-2.5 mr-1" />{stat.mvp_count}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {/* Hero Stats (MLBB) */}
        {isMlbb && heroStats && heroStats.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Hero Statistics</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Top {Math.min(15, (heroStats as any[]).length)} heroes</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-max min-w-full caption-bottom text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50 text-left">
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 px-4 h-10 text-left min-w-[140px]">Hero</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">Picks</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[65px]">Win%</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[55px]">K</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[55px]">D</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[55px]">A</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[65px]">KDA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(heroStats as any[]).slice(0, 15).map((hero: any, i: number) => (
                      <tr key={hero.hero_name || i} className="group hover:bg-muted/20 border-b border-border/30 transition-colors h-[52px]">
                        <td className="px-4 py-2">
                          <span className="font-bold text-sm text-foreground">{hero.hero_name}</span>
                        </td>
                        <td className="text-center px-3 py-2">
                          <span className="text-xs font-medium text-muted-foreground tabular-nums">{hero.total_picks}</span>
                        </td>
                        <td className="p-0 h-full border-l border-border/10">
                          <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                            style={getHeatmap(hero.win_rate || 0, (heroStats as any[]).slice(0, 15).map((h: any) => h.win_rate || 0))}
                          >
                            <span className={cn('text-xs font-bold tabular-nums', hero.win_rate >= 50 ? 'text-green-400' : 'text-red-400')}>
                              {hero.win_rate?.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-2">
                          <span className="text-xs font-medium text-green-400 tabular-nums">{hero.avg_kills?.toFixed(1)}</span>
                        </td>
                        <td className="text-center px-3 py-2">
                          <span className="text-xs font-medium text-red-400 tabular-nums">{hero.avg_deaths?.toFixed(1)}</span>
                        </td>
                        <td className="text-center px-3 py-2">
                          <span className="text-xs font-medium text-blue-400 tabular-nums">{hero.avg_assists?.toFixed(1)}</span>
                        </td>
                        <td className="p-0 h-full border-l border-border/10">
                          <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                            style={getHeatmap(hero.avg_kda || 0, (heroStats as any[]).slice(0, 15).map((h: any) => h.avg_kda || 0))}
                          >
                            <span className="text-xs font-bold tabular-nums text-foreground">{hero.avg_kda?.toFixed(2)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {/* Agent Stats (Valorant) */}
        {isValorant && agentStats && agentStats.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                  <Crosshair className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Agent Statistics</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Top {Math.min(15, (agentStats as any[]).length)} agents</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-max min-w-full caption-bottom text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50 text-left">
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 px-4 h-10 text-left min-w-[140px]">Agent</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">Picks</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[65px]">Win%</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[60px]">ACS</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[100px]">K/D/A</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[65px]">KDA</th>
                      <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground/80 text-center px-3 h-10 min-w-[50px]">FB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(agentStats as any[]).slice(0, 15).map((agent: any, i: number) => (
                      <tr key={agent.agent_name || i} className="group hover:bg-muted/20 border-b border-border/30 transition-colors h-[52px]">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{agent.agent_name}</span>
                            {agent.agent_role && (
                              <span className="text-[10px] text-muted-foreground/40 uppercase">{agent.agent_role}</span>
                            )}
                          </div>
                        </td>
                        <td className="text-center px-3 py-2">
                          <span className="text-xs font-medium text-muted-foreground tabular-nums">{agent.total_picks}</span>
                        </td>
                        <td className="p-0 h-full border-l border-border/10">
                          <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                            style={getHeatmap(agent.win_rate || 0, (agentStats as any[]).slice(0, 15).map((a: any) => a.win_rate || 0))}
                          >
                            <span className={cn('text-xs font-bold tabular-nums', agent.win_rate >= 50 ? 'text-green-400' : 'text-red-400')}>
                              {agent.win_rate?.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-0 h-full border-l border-border/10">
                          <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                            style={getHeatmap(agent.avg_acs || 0, (agentStats as any[]).slice(0, 15).map((a: any) => a.avg_acs || 0))}
                          >
                            <span className="text-xs font-medium text-foreground tabular-nums">{Math.round(agent.avg_acs || 0)}</span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-2">
                          <span className="text-xs font-medium text-muted-foreground tabular-nums">
                            {agent.avg_kills?.toFixed(1)}/{agent.avg_deaths?.toFixed(1)}/{agent.avg_assists?.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-0 h-full border-l border-border/10">
                          <div className="w-full h-full flex items-center justify-center min-h-[52px] px-3"
                            style={getHeatmap(agent.avg_kda || 0, (agentStats as any[]).slice(0, 15).map((a: any) => a.avg_kda || 0))}
                          >
                            <span className="text-xs font-bold tabular-nums text-foreground">{agent.avg_kda?.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="text-center px-3 py-2">
                          <span className="text-xs font-medium text-orange-400 tabular-nums">{agent.avg_first_bloods?.toFixed(1)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>
        )}

        {/* Map Stats (Valorant) */}
        {isValorant && mapStats && mapStats.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                  <Swords className="h-4 w-4" />
                </div>
                <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Map Statistics</h3>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(mapStats as any[]).map((map: any, i: number) => (
                    <motion.div
                      key={map.map_name || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="rounded-xl border border-border/30 bg-background/40 overflow-hidden"
                    >
                      {map.splash_image_url && (
                        <div className="relative h-24 w-full">
                          <Image src={map.splash_image_url} alt={map.map_name} fill className="object-cover opacity-40" />
                          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                          <div className="absolute bottom-2 left-3">
                            <h4 className="font-mango-grotesque text-lg font-bold text-foreground">{map.map_name}</h4>
                          </div>
                        </div>
                      )}
                      {!map.splash_image_url && (
                        <div className="px-4 pt-4">
                          <h4 className="font-mango-grotesque text-lg font-bold text-foreground">{map.map_name}</h4>
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground/60">Games</span>
                          <span className="font-medium tabular-nums">{map.total_games}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground/60">Pick Rate</span>
                          <span className="font-medium text-green-400 tabular-nums">{map.pick_rate?.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground/60">Ban Rate</span>
                          <span className="font-medium text-red-400 tabular-nums">{map.ban_rate?.toFixed(1)}%</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Recent Matches */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="pb-16"
        >
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Swords className="h-4 w-4" />
              </div>
              <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Recent Matches</h3>
            </div>

            <div className="divide-y divide-border/20">
              {matchesLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted/10 animate-pulse" />
                ))
              ) : recentMatches && recentMatches.length > 0 ? (
                recentMatches.slice(0, 5).map((match: MatchWithFullDetails) => {
                  const p1 = match.match_participants?.[0];
                  const p2 = match.match_participants?.[1];
                  const team1 = p1?.schools_teams;
                  const team2 = p2?.schools_teams;
                  const t1Score = p1?.match_score ?? 0;
                  const t2Score = p2?.match_score ?? 0;
                  const isFinished = match.status === 'finished' || match.status === 'completed';
                  const t1Win = isFinished && t1Score > t2Score;
                  const t2Win = isFinished && t2Score > t1Score;
                  const status = getMatchStatus(match.status);

                  return (
                    <Link key={match.id} href={`/matches/${match.id}`} className="group block">
                      <div className="px-4 sm:px-5 py-3 sm:py-4 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="hidden sm:flex flex-col items-center w-16 flex-shrink-0">
                            <span className={cn('text-[10px] font-bold uppercase tracking-widest', status.color)}>{status.label}</span>
                          </div>
                          <div className="flex-1 flex items-center justify-center gap-4">
                            <div className="flex items-center gap-2 flex-1 justify-end">
                              <span className={cn('font-mango-grotesque text-sm font-bold', t1Win ? 'text-foreground' : 'text-muted-foreground/50')}>
                                {team1?.school?.abbreviation || 'TBD'}
                              </span>
                              <Image src={team1?.school?.logo_url || '/img/cesafi-logo.webp'} alt="" width={32} height={32}
                                className={cn('h-7 w-7 rounded-full object-cover border', t1Win ? 'border-primary/60' : 'border-border/40')} />
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={cn('font-mango-grotesque text-xl font-black tabular-nums', t1Win ? 'text-primary' : 'text-muted-foreground/30')}>
                                {isFinished ? t1Score : '-'}
                              </span>
                              <span className="text-muted-foreground/15">—</span>
                              <span className={cn('font-mango-grotesque text-xl font-black tabular-nums', t2Win ? 'text-primary' : 'text-muted-foreground/30')}>
                                {isFinished ? t2Score : '-'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              <Image src={team2?.school?.logo_url || '/img/cesafi-logo.webp'} alt="" width={32} height={32}
                                className={cn('h-7 w-7 rounded-full object-cover border', t2Win ? 'border-primary/60' : 'border-border/40')} />
                              <span className={cn('font-mango-grotesque text-sm font-bold', t2Win ? 'text-foreground' : 'text-muted-foreground/50')}>
                                {team2?.school?.abbreviation || 'TBD'}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/60 transition-colors flex-shrink-0" />
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8 px-4">
                  <Gamepad2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground/60 text-sm">No recent matches found.</p>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
