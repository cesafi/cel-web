'use client';

import React, { useState } from 'react';
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
  Map,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getMlbbStats, getValorantStats, getHeroStats, getAgentStats, getMapStats } from '@/actions/statistics';
import { toPlayerSlug } from '@/lib/utils/player-slug';
import { CharacterStatsTable } from '@/components/statistics/character-stats-table';
import { MapStatsDisplay } from '@/components/statistics/map-stats-display';
import { PlayerLeaderboard } from '@/components/statistics/player-leaderboard';
import { HeroStats, AgentStats, MapStats } from '@/lib/types/stats-enhanced';

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
    queryKey: ['team-hero-stats', teamId, seasonId, school?.id],
    queryFn: async () => {
      const result = await getHeroStats(seasonId, undefined, undefined, undefined, teamId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: isMlbb && !!seasonId && !!school?.id,
  });

  // Agent stats for Valorant
  const { data: agentStats } = useQuery({
    queryKey: ['team-agent-stats', teamId, seasonId, school?.id],
    queryFn: async () => {
      const result = await getAgentStats(seasonId, undefined, undefined, undefined, teamId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: isValorant && !!seasonId && !!school?.id,
  });

  // Map stats for Valorant
  const { data: mapStats } = useQuery({
    queryKey: ['team-map-stats', seasonId, school?.id],
    queryFn: async () => {
      const result = await getMapStats(seasonId, undefined, undefined, teamId);
      if (!result.success) throw new Error(result.error);
      return result.data || [];
    },
    enabled: isValorant && !!seasonId && !!school?.id,
  });

  // Recent matches
  const { data: recentMatches, isLoading: matchesLoading } = useMatchesBySchoolId(school?.id || '', {
    limit: 5,
    season_id: seasonId,
    direction: 'past'
  });

  const playerStats = isMlbb ? mlbbStats : valorantStats;

  // Tab state
  type TeamTab = 'players' | 'heroes' | 'agents' | 'maps';
  const [activeTab, setActiveTab] = useState<TeamTab>('players');

  // Sort state for character/map stats tables
  const [sortColumn, setSortColumn] = useState<string>('games_played');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  // Sort data helper
  const sortData = <T extends Record<string, any>>(data: T[]): T[] => {
    return [...data].sort((a, b) => {
      const aVal = Number(a[sortColumn]) || 0;
      const bVal = Number(b[sortColumn]) || 0;
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  // Available tabs based on game
  const availableTabs: { key: TeamTab; label: string; icon: React.ReactNode }[] = [
    { key: 'players', label: 'Players', icon: <Users className="w-4 h-4" /> },
    ...(isMlbb ? [{ key: 'heroes' as TeamTab, label: 'Heroes', icon: <Shield className="w-4 h-4" /> }] : []),
    ...(isValorant ? [{ key: 'agents' as TeamTab, label: 'Agents', icon: <Crosshair className="w-4 h-4" /> }] : []),
    ...(isValorant ? [{ key: 'maps' as TeamTab, label: 'Maps', icon: <Map className="w-4 h-4" /> }] : []),
  ];

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

  // Heatmap helper (kept for team summary if needed)
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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
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

        {/* Roster (always visible, outside tabs) */}
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
                        <Link href={`/players/${toPlayerSlug(player.ign)}`} className="group block">
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

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="w-full bg-card/40 backdrop-blur-md border border-border/50 shadow-sm rounded-xl p-2 sm:p-3 overflow-x-auto scrollbar-hide">
            <nav className="flex gap-2" aria-label="Team statistics navigation">
              {availableTabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex min-w-0 flex-1 sm:flex-none items-center justify-center sm:justify-start gap-2 px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium',
                      'whitespace-nowrap transition-all duration-200 border',
                      isActive
                        ? cn(
                            isMlbb
                              ? 'border-blue-500 bg-blue-500/10 shadow-sm shadow-blue-500/20 text-blue-500'
                              : 'border-red-500 bg-red-500/10 shadow-sm shadow-red-500/20 text-red-500'
                          )
                        : 'border-border/50 bg-background text-muted-foreground hover:bg-muted/50 hover:border-border hover:text-foreground'
                    )}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Players Tab */}
          {activeTab === 'players' && sortedPlayerStats.length > 0 && (
            <PlayerLeaderboard
              game={isMlbb ? 'mlbb' : 'valorant'}
              data={sortedPlayerStats}
              sortColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}

          {/* Heroes Tab (MLBB) */}
          {activeTab === 'heroes' && isMlbb && heroStats && heroStats.length > 0 && (
            <CharacterStatsTable
              game="mlbb"
              data={sortData(heroStats as unknown as HeroStats[])}
              sortColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}

          {/* Agents Tab (Valorant) */}
          {activeTab === 'agents' && isValorant && agentStats && agentStats.length > 0 && (
            <CharacterStatsTable
              game="valorant"
              data={sortData(agentStats as unknown as AgentStats[])}
              sortColumn={sortColumn}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          )}

          {/* Maps Tab (Valorant) */}
          {activeTab === 'maps' && isValorant && mapStats && mapStats.length > 0 && (
            <MapStatsDisplay data={mapStats as unknown as MapStats[]} />
          )}
        </motion.div>

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
