'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSchoolByAbbreviation } from '@/hooks/use-schools';
import { useSchoolsTeamById } from '@/hooks/use-schools-teams';
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

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface TeamProfileProps {
  schoolAbbreviation: string;
  teamId: string;
}

export default function TeamProfile({ schoolAbbreviation, teamId }: TeamProfileProps) {
  const { data: school, isLoading: schoolLoading } = useSchoolByAbbreviation(schoolAbbreviation);
  const { data: team, isLoading: teamLoading } = useSchoolsTeamById(teamId);
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
          <Button asChild>
            <Link href={`/schools/${schoolAbbreviation}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to School
            </Link>
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
            <Link href={`/schools/${schoolAbbreviation}`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to {school.abbreviation}
            </Link>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Team Stats Summary */}
        {teamSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 py-8"
          >
            {[
              { label: 'Games', value: teamSummary.totalGames, icon: Gamepad2 },
              { label: 'Wins', value: teamSummary.totalWins, icon: Trophy },
              { label: 'Team KDA', value: teamSummary.kda, icon: Target },
              { label: 'Total Kills', value: teamSummary.totalKills, icon: Crosshair },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border border-border/40 bg-card/60 p-4 text-center">
                <stat.icon className="h-4 w-4 text-muted-foreground/40 mx-auto mb-2" />
                <div className="font-mango-grotesque text-2xl md:text-3xl font-bold text-foreground leading-none">
                  {stat.value}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Roster */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="py-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Users className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Roster</span>
            </div>
          </div>

          {playersLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-muted/30" />)}
            </div>
          ) : players && players.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {players.map((player: Player, index: number) => {
                // Find this player's stats
                const pStat = (playerStats as any[])?.find((s: any) => s.player_id === player.id);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Link href={`/players/${player.id}`} className="group block">
                      <div className="rounded-xl border border-border/40 bg-card/60 hover:border-border/60 hover:bg-card/80 transition-all duration-300 p-4 text-center">
                        <div className="relative h-14 w-14 mx-auto mb-3">
                          {player.photo_url ? (
                            <Image src={player.photo_url} alt={player.ign} fill className="rounded-full object-cover border border-border/40" />
                          ) : (
                            <div className="h-full w-full rounded-full bg-muted/50 flex items-center justify-center border border-border/40">
                              <span className="text-lg font-bold text-muted-foreground/40">{player.ign?.charAt(0) || '?'}</span>
                            </div>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {player.ign}
                        </h4>
                        {player.role && (
                          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mt-0.5">{player.role}</p>
                        )}
                        {pStat && (
                          <div className="mt-2 pt-2 border-t border-border/20">
                            <span className="text-[10px] text-muted-foreground/40">
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
            <div className="rounded-xl border border-border/40 bg-card/60 p-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground/60 text-sm">No roster data available for this team.</p>
            </div>
          )}
        </motion.section>

        <div className="h-px bg-border/20" />

        {/* Player Stats Table */}
        {playerStats && playerStats.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="py-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Target className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Player Statistics</span>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      <th className="text-left px-4 py-3 font-medium">Player</th>
                      <th className="text-center px-3 py-3 font-medium">GP</th>
                      <th className="text-center px-3 py-3 font-medium">K</th>
                      <th className="text-center px-3 py-3 font-medium">D</th>
                      <th className="text-center px-3 py-3 font-medium">A</th>
                      <th className="text-center px-3 py-3 font-medium">KDA</th>
                      {isMlbb && <th className="text-center px-3 py-3 font-medium">Gold</th>}
                      {isValorant && <th className="text-center px-3 py-3 font-medium">ACS</th>}
                      {isValorant && <th className="text-center px-3 py-3 font-medium">FB</th>}
                      <th className="text-center px-3 py-3 font-medium">MVP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(playerStats as any[]).sort((a: any, b: any) => (b.total_kills + b.total_assists) - (a.total_kills + a.total_assists)).map((stat: any, i: number) => {
                      const kda = stat.total_deaths > 0 ? ((stat.total_kills + stat.total_assists) / stat.total_deaths).toFixed(2) : 'Perfect';
                      return (
                        <tr key={stat.player_id} className={cn('border-b border-border/10 hover:bg-muted/20 transition-colors', i === 0 && 'bg-primary/5')}>
                          <td className="px-4 py-3">
                            <Link href={`/players/${stat.player_id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                              <span className="font-medium text-foreground">{stat.player_ign || 'Unknown'}</span>
                            </Link>
                          </td>
                          <td className="text-center px-3 py-3 text-muted-foreground">{stat.games_played}</td>
                          <td className="text-center px-3 py-3 text-green-400">{stat.total_kills}</td>
                          <td className="text-center px-3 py-3 text-red-400">{stat.total_deaths}</td>
                          <td className="text-center px-3 py-3 text-blue-400">{stat.total_assists}</td>
                          <td className="text-center px-3 py-3 font-medium text-foreground">{kda}</td>
                          {isMlbb && <td className="text-center px-3 py-3 text-yellow-400">{Math.round(stat.total_gold || 0).toLocaleString()}</td>}
                          {isValorant && <td className="text-center px-3 py-3 text-foreground">{Math.round(stat.avg_acs || 0)}</td>}
                          {isValorant && <td className="text-center px-3 py-3 text-orange-400">{stat.total_first_bloods || 0}</td>}
                          <td className="text-center px-3 py-3">
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
            className="py-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Hero Statistics</span>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      <th className="text-left px-4 py-3 font-medium">Hero</th>
                      <th className="text-center px-3 py-3 font-medium">Picks</th>
                      <th className="text-center px-3 py-3 font-medium">Win%</th>
                      <th className="text-center px-3 py-3 font-medium">Avg K</th>
                      <th className="text-center px-3 py-3 font-medium">Avg D</th>
                      <th className="text-center px-3 py-3 font-medium">Avg A</th>
                      <th className="text-center px-3 py-3 font-medium">KDA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(heroStats as any[]).slice(0, 15).map((hero: any, i: number) => (
                      <tr key={hero.hero_name || i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{hero.hero_name}</td>
                        <td className="text-center px-3 py-3 text-muted-foreground">{hero.total_picks}</td>
                        <td className="text-center px-3 py-3">
                          <span className={cn(hero.win_rate >= 50 ? 'text-green-400' : 'text-red-400')}>
                            {hero.win_rate?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center px-3 py-3 text-green-400">{hero.avg_kills?.toFixed(1)}</td>
                        <td className="text-center px-3 py-3 text-red-400">{hero.avg_deaths?.toFixed(1)}</td>
                        <td className="text-center px-3 py-3 text-blue-400">{hero.avg_assists?.toFixed(1)}</td>
                        <td className="text-center px-3 py-3 font-medium text-foreground">{hero.avg_kda?.toFixed(2)}</td>
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
            className="py-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                <Crosshair className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Agent Statistics</span>
              </div>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/20 text-[10px] uppercase tracking-widest text-muted-foreground/50">
                      <th className="text-left px-4 py-3 font-medium">Agent</th>
                      <th className="text-center px-3 py-3 font-medium">Picks</th>
                      <th className="text-center px-3 py-3 font-medium">Win%</th>
                      <th className="text-center px-3 py-3 font-medium">ACS</th>
                      <th className="text-center px-3 py-3 font-medium">K/D/A</th>
                      <th className="text-center px-3 py-3 font-medium">KDA</th>
                      <th className="text-center px-3 py-3 font-medium">FB</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(agentStats as any[]).slice(0, 15).map((agent: any, i: number) => (
                      <tr key={agent.agent_name || i} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{agent.agent_name}</span>
                            {agent.agent_role && (
                              <span className="text-[10px] text-muted-foreground/40 uppercase">{agent.agent_role}</span>
                            )}
                          </div>
                        </td>
                        <td className="text-center px-3 py-3 text-muted-foreground">{agent.total_picks}</td>
                        <td className="text-center px-3 py-3">
                          <span className={cn(agent.win_rate >= 50 ? 'text-green-400' : 'text-red-400')}>
                            {agent.win_rate?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-center px-3 py-3 text-foreground">{Math.round(agent.avg_acs || 0)}</td>
                        <td className="text-center px-3 py-3 text-muted-foreground">
                          {agent.avg_kills?.toFixed(1)}/{agent.avg_deaths?.toFixed(1)}/{agent.avg_assists?.toFixed(1)}
                        </td>
                        <td className="text-center px-3 py-3 font-medium text-foreground">{agent.avg_kda?.toFixed(2)}</td>
                        <td className="text-center px-3 py-3 text-orange-400">{agent.avg_first_bloods?.toFixed(1)}</td>
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
            className="py-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                <Swords className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">Map Statistics</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(mapStats as any[]).map((map: any, i: number) => (
                <motion.div
                  key={map.map_name || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="rounded-xl border border-border/40 bg-card/60 overflow-hidden"
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
                      <span className="font-medium">{map.total_games}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground/60">Pick Rate</span>
                      <span className="font-medium text-green-400">{map.pick_rate?.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground/60">Ban Rate</span>
                      <span className="font-medium text-red-400">{map.ban_rate?.toFixed(1)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        <div className="h-px bg-border/20" />

        {/* Recent Matches */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="py-8 pb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Swords className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Recent Matches</span>
            </div>
          </div>

          {matchesLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl bg-muted/30" />)}
            </div>
          ) : recentMatches && recentMatches.length > 0 ? (
            <div className="space-y-3">
              {recentMatches.slice(0, 5).map((match: MatchWithFullDetails) => {
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
                    <div className="rounded-xl border border-border/40 bg-card/60 hover:border-border/60 transition-all duration-300 px-5 py-4">
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
                            <span className={cn('font-mango-grotesque text-xl font-black', t1Win ? 'text-primary' : 'text-muted-foreground/30')}>
                              {isFinished ? t1Score : '-'}
                            </span>
                            <span className="text-muted-foreground/15">—</span>
                            <span className={cn('font-mango-grotesque text-xl font-black', t2Win ? 'text-primary' : 'text-muted-foreground/30')}>
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
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-border/40 bg-card/60 p-12 text-center">
              <Gamepad2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-muted-foreground/60 text-sm">No recent matches found.</p>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
}
