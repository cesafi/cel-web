import { getMatchById } from '@/actions/matches';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Calendar, Clock, MapPin, Trophy, Swords, ArrowLeft, Gamepad2, Shield } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { PublicMatchStats } from '@/components/matches/public-match-stats';
import { PublicMapVetoTable } from '@/components/veto/public-map-veto';
import { LocalTime } from '@/components/shared/local-time';

export const revalidate = 300; // Revalidate every 5 minutes

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface PublicMatchPageProps {
  params: Promise<{
    matchId: string;
  }>;
}

export async function generateMetadata({ params }: PublicMatchPageProps): Promise<Metadata> {
  const { matchId } = await params;
  const numericId = Number(matchId);
  if (isNaN(numericId)) notFound();
  const result = await getMatchById(numericId);

  if (!result.success || !result.data) {
    return { title: 'Match Not Found' };
  }

  const match = result.data;
  const sport = match.esports_seasons_stages?.esports_categories?.esports?.name || 'Esports';
  const team1 = match.match_participants?.[0]?.schools_teams?.school?.abbreviation || 'Team 1';
  const team2 = match.match_participants?.[1]?.schools_teams?.school?.abbreviation || 'Team 2';

  return {
    title: `${team1} vs ${team2} - ${sport} | CESAFI Esports`,
    description: `Match details for ${team1} vs ${team2} in ${sport}`,
  };
}

export default async function PublicMatchPage({ params }: PublicMatchPageProps) {
  const { matchId } = await params;
  const numericId = Number(matchId);
  if (isNaN(numericId)) notFound();
  const result = await getMatchById(numericId);

  if (!result.success || !result.data) {
    notFound();
  }

  const match = result.data;
  const esport = match.esports_seasons_stages?.esports_categories?.esports;
  const sport = esport?.name || '';
  const isValorant = sport.toLowerCase().includes('valorant');
  const isMlbb = sport.toLowerCase().includes('mobile legends') || sport.toLowerCase().includes('mlbb');
  const category = match.esports_seasons_stages?.esports_categories;
  const stage = match.esports_seasons_stages?.competition_stage || 'Unknown Stage';

  const p1 = match.match_participants?.[0];
  const p2 = match.match_participants?.[1];
  const team1 = p1?.schools_teams;
  const team2 = p2?.schools_teams;

  if (!team1 || !team2) {
    return (
      <div className="container max-w-6xl py-20 text-center">
        <p className="text-muted-foreground text-lg">Incomplete match data</p>
      </div>
    );
  }

  const t1Score = p1?.match_score ?? 0;
  const t2Score = p2?.match_score ?? 0;
  const isFinished = match.status === 'finished' || match.status === 'completed';
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const t1Win = isFinished && t1Score > t2Score;
  const t2Win = isFinished && t2Score > t1Score;

  const sortedGames = match.games ? [...match.games].sort((a, b) => a.game_number - b.game_number) : [];
  const bestOf = match.best_of || sortedGames.length || 1;

  // Build best-of indicator dots
  const gamesToWin = Math.ceil(bestOf / 2);

  const statusConfig = {
    live: { label: 'LIVE', color: 'bg-red-500', textColor: 'text-red-500', animate: true },
    finished: { label: 'FINAL', color: 'bg-zinc-500', textColor: 'text-zinc-400', animate: false },
    completed: { label: 'FINAL', color: 'bg-zinc-500', textColor: 'text-zinc-400', animate: false },
    upcoming: { label: 'UPCOMING', color: 'bg-primary', textColor: 'text-primary', animate: false },
    canceled: { label: 'CANCELED', color: 'bg-zinc-600', textColor: 'text-zinc-500', animate: false },
    rescheduled: { label: 'RESCHEDULED', color: 'bg-yellow-500', textColor: 'text-yellow-500', animate: false },
  };

  const status = statusConfig[match.status as keyof typeof statusConfig] || statusConfig.upcoming;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Scoreboard — KEPT AS-IS */}
      <div className="relative overflow-hidden border-b border-border/30">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

        {/* Esport watermark */}
        {esport?.logo_url && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
            <Image src={esport.logo_url} alt="" width={400} height={400} className="h-96 w-96 object-contain" />
          </div>
        )}

        <div className="container relative max-w-6xl mx-auto px-4 pt-12 pb-10">
          {/* Back + Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Schedule</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {/* Status badge */}
              <div className="flex items-center gap-1.5">
                {status.animate && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                )}
                <span className={cn('text-xs font-bold uppercase tracking-widest', status.textColor)}>
                  {status.label}
                </span>
              </div>

              <span className="text-border">|</span>

              {/* Esport info */}
              <div className="flex items-center gap-1.5">
                {esport?.logo_url && (
                  <Image src={esport.logo_url} alt={esport.name || ''} width={16} height={16} className="h-4 w-4 object-contain" />
                )}
                <span>{sport}</span>
              </div>

              <span className="text-border">|</span>
              <span>{category?.division || 'Open'} • {stage}</span>
            </div>
          </div>

          {/* Main Scoreboard */}
          <div className="grid grid-cols-3 items-center gap-4 lg:gap-8">
            {/* Team 1 */}
            <div className="flex flex-col items-center gap-3 lg:flex-row lg:justify-end lg:gap-6">
              <div className={cn('order-2 lg:order-1 text-center lg:text-right', t1Win && 'text-foreground', !t1Win && isFinished && 'text-muted-foreground/60')}>
                <h2 className="font-mango-grotesque text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide leading-none">
                  {team1.school?.abbreviation || 'T1'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground/50 mt-1 hidden sm:block max-w-[180px] truncate lg:ml-auto">
                  {team1.school?.name || team1.name}
                </p>
              </div>
              <div className="relative order-1 lg:order-2 flex-shrink-0">
                <div className={cn(
                  'absolute inset-0 rounded-full blur-md scale-110',
                  t1Win ? 'bg-primary/25' : 'bg-transparent'
                )} />
                <Image
                  src={team1.school?.logo_url || '/img/cesafi-logo.webp'}
                  alt={team1.school?.abbreviation || 'Team 1'}
                  width={80}
                  height={80}
                  className={cn(
                    'relative z-10 h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2',
                    t1Win ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/50'
                  )}
                />
                {t1Win && (
                  <div className="absolute -top-1 -right-1 z-20 bg-yellow-500 rounded-full p-1 shadow-lg shadow-yellow-500/30">
                    <Trophy className="h-3.5 w-3.5 text-yellow-900" />
                  </div>
                )}
              </div>
            </div>

            {/* Center Score */}
            <div className="flex flex-col items-center">
              {isUpcoming ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                    <div className="relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
                      <Swords className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                    </div>
                  </div>
                  {match.scheduled_at && (
                    <div className="text-center mt-2">
                      <div className="text-xs text-muted-foreground/60">
                        <LocalTime dateString={match.scheduled_at} format="date" dateOptions={{ weekday: 'short', month: 'short', day: 'numeric' }} />
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        <LocalTime dateString={match.scheduled_at} format="time" />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 sm:gap-5">
                    <span className={cn(
                      'font-mango-grotesque text-5xl sm:text-6xl lg:text-7xl font-black tabular-nums leading-none',
                      t1Win ? 'text-primary' : isFinished ? 'text-muted-foreground/40' : 'text-foreground'
                    )}>
                      {t1Score}
                    </span>
                    <span className="text-muted-foreground/20 text-2xl font-light">—</span>
                    <span className={cn(
                      'font-mango-grotesque text-5xl sm:text-6xl lg:text-7xl font-black tabular-nums leading-none',
                      t2Win ? 'text-primary' : isFinished ? 'text-muted-foreground/40' : 'text-foreground'
                    )}>
                      {t2Score}
                    </span>
                  </div>

                  {/* Best-of dots */}
                  <div className="flex items-center gap-1 mt-3">
                    {Array.from({ length: gamesToWin }).map((_, i) => (
                      <div
                        key={`t1-${i}`}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full transition-all',
                          i < t1Score ? 'bg-primary shadow-[0_0_4px_rgba(var(--primary),0.5)]' : 'bg-muted-foreground/20'
                        )}
                      />
                    ))}
                    <div className="w-px h-3 bg-border/50 mx-1.5" />
                    {Array.from({ length: gamesToWin }).map((_, i) => (
                      <div
                        key={`t2-${i}`}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full transition-all',
                          i < t2Score ? 'bg-primary shadow-[0_0_4px_rgba(var(--primary),0.5)]' : 'bg-muted-foreground/20'
                        )}
                      />
                    ))}
                  </div>
                </>
              )}

              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mt-2 font-medium">
                Best of {bestOf}
              </span>
            </div>

            {/* Team 2 */}
            <div className="flex flex-col items-center gap-3 lg:flex-row lg:justify-start lg:gap-6">
              <div className="relative flex-shrink-0">
                <div className={cn(
                  'absolute inset-0 rounded-full blur-md scale-110',
                  t2Win ? 'bg-primary/25' : 'bg-transparent'
                )} />
                <Image
                  src={team2.school?.logo_url || '/img/cesafi-logo.webp'}
                  alt={team2.school?.abbreviation || 'Team 2'}
                  width={80}
                  height={80}
                  className={cn(
                    'relative z-10 h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2',
                    t2Win ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/50'
                  )}
                />
                {t2Win && (
                  <div className="absolute -top-1 -left-1 z-20 bg-yellow-500 rounded-full p-1 shadow-lg shadow-yellow-500/30">
                    <Trophy className="h-3.5 w-3.5 text-yellow-900" />
                  </div>
                )}
              </div>
              <div className={cn('text-center lg:text-left', t2Win && 'text-foreground', !t2Win && isFinished && 'text-muted-foreground/60')}>
                <h2 className="font-mango-grotesque text-2xl sm:text-3xl lg:text-4xl font-bold tracking-wide leading-none">
                  {team2.school?.abbreviation || 'T2'}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground/50 mt-1 hidden sm:block max-w-[180px] truncate">
                  {team2.school?.name || team2.name}
                </p>
              </div>
            </div>
          </div>

          {/* Match Info Chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            {match.scheduled_at && !isUpcoming && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/30 px-3 py-1.5 rounded-full border border-border/30">
                <Calendar className="w-3 h-3" />
                <LocalTime dateString={match.scheduled_at} format="date" dateOptions={{ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }} />
              </div>
            )}
            {match.scheduled_at && !isUpcoming && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/30 px-3 py-1.5 rounded-full border border-border/30">
                <Clock className="w-3 h-3" />
                <LocalTime dateString={match.scheduled_at} format="time" />
              </div>
            )}
            {match.venue && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/30 px-3 py-1.5 rounded-full border border-border/30">
                <MapPin className="w-3 h-3" />
                <span>{match.venue}</span>
              </div>
            )}
            {match.group_name && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 bg-muted/30 px-3 py-1.5 rounded-full border border-border/30">
                <Shield className="w-3 h-3" />
                <span>Group {match.group_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area — Full width, no sidebar */}
      <div className="container max-w-6xl mx-auto px-4 py-8 md:py-10 space-y-8">

        {/* Map Veto (Valorant only) */}
        {isValorant && (
          <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <Swords className="h-4 w-4" />
              </div>
              <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Map Veto</h3>
            </div>
            <div className="p-4 sm:p-6">
              <PublicMapVetoTable
                matchId={match.id}
                bestOf={match.best_of || 3}
                team1={{
                  id: team1.id,
                  name: team1.name,
                  abbreviation: team1.school?.abbreviation || 'T1',
                  logoUrl: team1.school?.logo_url,
                }}
                team2={{
                  id: team2.id,
                  name: team2.name,
                  abbreviation: team2.school?.abbreviation || 'T2',
                  logoUrl: team2.school?.logo_url,
                }}
                coinTossWinnerId={match.coin_toss_winner_id}
                coinTossResult={match.coin_toss_result}
              />
            </div>
          </div>
        )}

        {/* Game Statistics Section */}
        <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-muted/5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-mango-grotesque text-lg sm:text-xl font-bold tracking-wide">Post-Game Statistics</h3>
              {sortedGames.length > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {sortedGames.length} game{sortedGames.length !== 1 ? 's' : ''} recorded
                </p>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {match.games && match.games.length > 0 ? (
              <PublicMatchStats games={match.games} sport={sport} matchParticipants={match.match_participants} />
            ) : (
              <div className="text-center py-8">
                <Gamepad2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground/60 text-sm">
                  {isUpcoming
                    ? 'Game statistics will appear here once the match begins.'
                    : 'No match data available yet.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
