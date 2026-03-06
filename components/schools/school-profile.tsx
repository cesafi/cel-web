'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSchoolByAbbreviation } from '@/hooks/use-schools';
import { useSchoolsTeamsBySchoolAndSeason, useActiveTeamsBySchool } from '@/hooks/use-schools-teams';
import { SchoolsTeamWithSportDetails } from '@/lib/types/schools-teams';
import { MatchWithFullDetails } from '@/lib/types/matches';
import { useMatchesBySchoolId } from '@/hooks/use-matches';
import { useAllSeasons } from '@/hooks/use-seasons';
import { useSeason } from '@/components/contexts/season-provider';
import { Season } from '@/lib/types/seasons';
import { formatCategoryName } from '@/lib/utils/esports';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Trophy,
  Users,
  ArrowLeft,
  ChevronRight,
  Gamepad2,
  Swords,
  CalendarDays,
} from 'lucide-react';
import { moderniz } from '@/lib/fonts';
import { toTeamSlug } from '@/lib/utils/team-slug';

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface SchoolProfileProps {
  schoolAbbreviation: string;
}

export default function SchoolProfile({ schoolAbbreviation }: SchoolProfileProps) {
  const router = useRouter();
  const { data: school, isLoading: schoolLoading, error: schoolError } = useSchoolByAbbreviation(schoolAbbreviation);
  const { data: seasons, isLoading: seasonsLoading } = useAllSeasons();
  const { currentSeason: selectedSeason, setCurrentSeason: setSelectedSeason } = useSeason();

  const { data: seasonTeams, isLoading: seasonTeamsLoading } = useSchoolsTeamsBySchoolAndSeason(
    school?.id || '',
    selectedSeason?.id || 0
  );
  const { data: activeTeams, isLoading: activeTeamsLoading } = useActiveTeamsBySchool(school?.id || '');

  const teams = selectedSeason?.id ? seasonTeams : activeTeams;
  const teamsLoading = selectedSeason?.id ? seasonTeamsLoading : activeTeamsLoading;
  const typedTeams = teams as SchoolsTeamWithSportDetails[] | undefined;

  const { data: recentMatches, isLoading: matchesLoading } = useMatchesBySchoolId(school?.id || '', {
    limit: 5,
    season_id: selectedSeason?.id,
    direction: 'past'
  });

  const handleSeasonSelect = (season: Season | null) => {
    if (setSelectedSeason && typeof setSelectedSeason === 'function') {
      setSelectedSeason(season);
    }
  };

  const sortedSeasons = seasons && seasons.length > 0
    ? [...seasons].sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime())
    : [];

  // ------- Loading State -------
  if (schoolLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative w-full h-[50vh] min-h-[400px] bg-muted/30 animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-12">
            <div className="flex justify-center gap-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-28 rounded-lg bg-muted/50" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl bg-muted/50" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------- Error State -------
  if (schoolError || !school) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <Building2 className="h-16 w-16 text-muted-foreground mx-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">School Not Found</h1>
            <p className="text-muted-foreground">The school you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          </div>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // ------- Helper: Get Esport Color -------
  const getEsportAccent = (esportName?: string | null) => {
    const name = esportName?.toLowerCase() || '';
    if (name.includes('mlbb') || name.includes('mobile legends')) return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' };
    if (name.includes('valorant')) return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' };
    return { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', dot: 'bg-primary' };
  };

  // ------- Helper: Match Status -------
  const getMatchStatus = (status: string) => {
    const configs: Record<string, { label: string; color: string; animate: boolean }> = {
      live: { label: 'LIVE', color: 'text-red-500', animate: true },
      finished: { label: 'FINAL', color: 'text-muted-foreground', animate: false },
      completed: { label: 'FINAL', color: 'text-muted-foreground', animate: false },
      upcoming: { label: 'UPCOMING', color: 'text-primary', animate: false },
      canceled: { label: 'CANCELED', color: 'text-muted-foreground/50', animate: false },
      rescheduled: { label: 'RESCHEDULED', color: 'text-yellow-500', animate: false },
    };
    return configs[status] || configs.upcoming;
  };

  // ------- Render -------
  return (
    <div className="min-h-screen bg-background">
      {/* Full-Width Hero Banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative w-full h-[50vh] min-h-[400px] overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('/img/cclex-banner.webp')] bg-cover bg-center bg-no-repeat"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"></div>
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-10">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="backdrop-blur-sm bg-black/20 hover:bg-black/40 text-white border-white/20">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* School Branding - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center md:flex-row md:items-end md:text-left gap-6">
              {/* Logo */}
              <div className="relative h-24 w-24 md:h-32 md:w-32 flex-shrink-0">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-125" />
                {school.logo_url ? (
                  <Image
                    src={school.logo_url}
                    alt={school.name}
                    fill
                    className="relative z-10 object-contain drop-shadow-2xl"
                  />
                ) : (
                  <div className="relative z-10 h-full w-full flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <Image src="/img/cesafi-logo.webp" alt="CESAFI" width={64} height={64} className="object-contain" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-white pb-2">
                <h1 className={cn('font-mango-grotesque text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide leading-none drop-shadow-lg')}>
                  {school.name}
                </h1>
                <p className="text-lg md:text-xl text-white/70 font-medium mt-2">{school.abbreviation}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content — Sidebar + Content layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

          {/* Season Sidebar — Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-6">
              <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <h3 className="font-mango-grotesque text-lg font-bold tracking-wide">Seasons</h3>
                </div>
                <div className="divide-y divide-border/20">
                  {seasonsLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="h-14 bg-muted/10 animate-pulse" />
                    ))
                  ) : sortedSeasons.length > 0 ? (
                    sortedSeasons.map((season) => {
                      const isActive = selectedSeason?.id === season.id;
                      return (
                        <button
                          key={season.id}
                          onClick={() => handleSeasonSelect(season)}
                          className={cn(
                            'relative w-full px-4 py-3 text-left transition-all duration-200 hover:bg-muted/20',
                            isActive && 'bg-muted/30'
                          )}
                        >
                          {isActive && <div className="absolute top-0 right-0 bottom-0 w-1 bg-primary rounded-l" />}
                          <div className="text-sm font-medium text-foreground">
                            {season.name || `Season ${season.id}`}
                          </div>
                          <div className="text-[10px] text-muted-foreground/50 mt-0.5">
                            {new Date(season.start_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            {' – '}
                            {new Date(season.end_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground/50">No seasons available</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Season Selector — Mobile */}
          <div className="lg:hidden">
            <Select
              value={selectedSeason?.id?.toString() || ''}
              onValueChange={(val) => {
                const season = sortedSeasons.find(s => s.id === Number(val));
                if (season) handleSeasonSelect(season);
              }}
            >
              <SelectTrigger className="w-full h-10 bg-card/30 backdrop-blur-xl border-border/50 font-medium text-sm shadow-lg rounded-xl">
                <SelectValue placeholder="Select Season" />
              </SelectTrigger>
              <SelectContent>
                {sortedSeasons.map((season) => (
                  <SelectItem key={season.id} value={season.id.toString()}>
                    {season.name || `Season ${season.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Teams Section */}
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
                  <div>
                    <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Teams</h3>
                    {typedTeams && typedTeams.length > 0 && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {typedTeams.length} team{typedTeams.length !== 1 ? 's' : ''} competing
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  {teamsLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-xl bg-muted/30" />
                      ))}
                    </div>
                  ) : typedTeams && typedTeams.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {typedTeams.map((team, index) => {
                        const esportName = team.esports_categories?.esports?.name;
                        const accent = getEsportAccent(esportName);
                        return (
                          <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.06 }}
                          >
                            <Link
                              href={`/schools/${schoolAbbreviation.toLowerCase()}/teams/${toTeamSlug({
                                seasonName: (team as any).seasons?.name || '',
                                esportName: team.esports_categories?.esports?.name || '',
                                division: team.esports_categories?.division || '',
                                teamName: team.name,
                              })}`}
                              className="group block"
                            >
                              <div className="relative rounded-xl border border-border/30 bg-background/40 p-4 hover:border-border/60 hover:bg-muted/10 transition-all duration-300 overflow-hidden">
                                {/* Subtle accent glow */}
                                <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2', accent.dot)} />

                                <div className="relative z-10 flex items-start justify-between">
                                  <div className="space-y-2 flex-1 min-w-0">
                                    {/* Game badge */}
                                    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border', accent.bg, accent.border, accent.text)}>
                                      <span className={cn('w-1.5 h-1.5 rounded-full', accent.dot)} />
                                      {esportName || 'Esport'}
                                    </div>

                                    {/* Team name */}
                                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                      {team.name}
                                    </h3>

                                    {/* Division / Category */}
                                    <p className="text-xs text-muted-foreground/60">
                                      {team.esports_categories ? formatCategoryName(team.esports_categories.division, team.esports_categories.levels) : 'Category'}
                                    </p>
                                  </div>

                                  {/* Arrow */}
                                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 flex-shrink-0" />
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground/60 text-sm">
                        No teams found for this school{selectedSeason ? ` in ${selectedSeason.name || 'this season'}` : ''}.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Recent Matches Section */}
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Swords className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Recent Matches</h3>
                    {recentMatches && recentMatches.length > 0 && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {recentMatches.length} match{recentMatches.length !== 1 ? 'es' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-border/20">
                  {matchesLoading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted/10 animate-pulse" />
                    ))
                  ) : recentMatches && recentMatches.length > 0 ? (
                    recentMatches.slice(0, 5).map((match: MatchWithFullDetails, index: number) => {
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
                      const esportName = match.esports_seasons_stages?.esports_categories?.esports?.name;
                      const esportLogo = match.esports_seasons_stages?.esports_categories?.esports?.logo_url;

                      return (
                        <Link key={match.id} href={`/matches/${match.id}`} className="group block">
                          <div className="px-4 sm:px-5 py-3 sm:py-4 hover:bg-muted/10 transition-colors">
                            <div className="flex items-center gap-4">
                              {/* Status + Meta */}
                              <div className="hidden sm:flex flex-col items-center gap-1 w-20 flex-shrink-0">
                                <div className="flex items-center gap-1">
                                  {status.animate && (
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                                    </span>
                                  )}
                                  <span className={cn('text-[10px] font-bold uppercase tracking-widest', status.color)}>
                                    {status.label}
                                  </span>
                                </div>
                                {esportLogo && (
                                  <Image src={esportLogo} alt="" width={16} height={16} className="h-4 w-4 object-contain opacity-40" />
                                )}
                              </div>

                              {/* Scoreboard */}
                              <div className="flex-1 flex items-center justify-center gap-4 sm:gap-6">
                                {/* Team 1 */}
                                <div className="flex items-center gap-2.5 flex-1 justify-end">
                                  <span className={cn(
                                    'font-mango-grotesque text-sm sm:text-base font-bold tracking-wide text-right truncate',
                                    t1Win ? 'text-foreground' : isFinished ? 'text-muted-foreground/50' : 'text-foreground/80'
                                  )}>
                                    {team1?.school?.abbreviation || 'TBD'}
                                  </span>
                                  <div className="relative flex-shrink-0">
                                    <Image
                                      src={team1?.school?.logo_url || '/img/cesafi-logo.webp'}
                                      alt=""
                                      width={36}
                                      height={36}
                                      className={cn(
                                        'h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border',
                                        t1Win ? 'border-primary/60' : 'border-border/40'
                                      )}
                                    />
                                    {t1Win && (
                                      <div className="absolute -top-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 shadow-sm">
                                        <Trophy className="h-2 w-2 text-yellow-900" />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Score */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={cn(
                                    'font-mango-grotesque text-2xl sm:text-3xl font-black tabular-nums leading-none',
                                    t1Win ? 'text-primary' : isFinished ? 'text-muted-foreground/30' : 'text-foreground'
                                  )}>
                                    {isFinished || match.status === 'live' ? t1Score : '-'}
                                  </span>
                                  <span className="text-muted-foreground/15 text-lg">—</span>
                                  <span className={cn(
                                    'font-mango-grotesque text-2xl sm:text-3xl font-black tabular-nums leading-none',
                                    t2Win ? 'text-primary' : isFinished ? 'text-muted-foreground/30' : 'text-foreground'
                                  )}>
                                    {isFinished || match.status === 'live' ? t2Score : '-'}
                                  </span>
                                </div>

                                {/* Team 2 */}
                                <div className="flex items-center gap-2.5 flex-1">
                                  <div className="relative flex-shrink-0">
                                    <Image
                                      src={team2?.school?.logo_url || '/img/cesafi-logo.webp'}
                                      alt=""
                                      width={36}
                                      height={36}
                                      className={cn(
                                        'h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover border',
                                        t2Win ? 'border-primary/60' : 'border-border/40'
                                      )}
                                    />
                                    {t2Win && (
                                      <div className="absolute -top-0.5 -left-0.5 bg-yellow-500 rounded-full p-0.5 shadow-sm">
                                        <Trophy className="h-2 w-2 text-yellow-900" />
                                      </div>
                                    )}
                                  </div>
                                  <span className={cn(
                                    'font-mango-grotesque text-sm sm:text-base font-bold tracking-wide truncate',
                                    t2Win ? 'text-foreground' : isFinished ? 'text-muted-foreground/50' : 'text-foreground/80'
                                  )}>
                                    {team2?.school?.abbreviation || 'TBD'}
                                  </span>
                                </div>
                              </div>

                              {/* Game + Date info (desktop) */}
                              <div className="hidden md:flex flex-col items-end gap-1 w-28 flex-shrink-0 text-right">
                                <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider">
                                  {esportName || ''}
                                </span>
                                {match.scheduled_at && (
                                  <span className="text-[10px] text-muted-foreground/30">
                                    {new Date(match.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>

                              {/* Arrow */}
                              <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/60 transition-colors flex-shrink-0" />
                            </div>

                            {/* Mobile status bar */}
                            <div className="flex sm:hidden items-center justify-between mt-2">
                              <div className="flex items-center gap-1.5">
                                {status.animate && (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                                  </span>
                                )}
                                <span className={cn('text-[10px] font-bold uppercase tracking-widest', status.color)}>
                                  {status.label}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground/30">
                                {esportName}{match.scheduled_at ? ` · ${new Date(match.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 px-4">
                      <Gamepad2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-muted-foreground/60 text-sm">
                        No recent matches found for this school{selectedSeason ? ` in ${selectedSeason.name || 'this season'}` : ''}.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-border/20">
                  <Button variant="outline" size="sm" asChild className="w-full border-border/40 hover:border-border/60">
                    <Link href="/schedule">
                      View All Matches
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
