'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Calendar, MapPin, Flame, Gamepad2, ArrowRight } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import { MatchWithFullDetails } from '@/lib/types/matches';
import Image from 'next/image';
import Link from 'next/link';

interface UpcomingGamesProps {
  initialMatches: MatchWithFullDetails[];
}

function CountdownTimer({ scheduledAt }: { scheduledAt: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date(scheduledAt).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60)
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt]);

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hrs', value: timeLeft.hours },
    { label: 'Min', value: timeLeft.minutes },
    { label: 'Sec', value: timeLeft.seconds }
  ];

  return (
    <div className="flex items-center gap-2">
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-2">
          <div className="flex flex-col items-center">
            <span className={`${moderniz.className} text-2xl sm:text-3xl font-black text-foreground tabular-nums leading-none`}>
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
              {unit.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-primary/40 text-lg font-light self-start mt-0.5">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

function TeamDisplay({
  name,
  abbreviation,
  logoUrl,
  align = 'center',
  size = 'default'
}: {
  name: string;
  abbreviation: string;
  logoUrl: string | null;
  align?: 'left' | 'right' | 'center';
  size?: 'default' | 'large';
}) {
  const imgSize = size === 'large' ? 80 : 56;
  const imgClass = size === 'large'
    ? 'h-16 w-16 sm:h-20 sm:w-20'
    : 'h-12 w-12 sm:h-14 sm:w-14';

  return (
    <div className={`flex flex-col items-center gap-3 ${align === 'right' ? 'lg:items-end' : align === 'left' ? 'lg:items-start' : 'items-center'}`}>
      <div className="relative group/logo">
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-md scale-110 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500" />
        <Image
          src={logoUrl ?? '/img/cesafi-logo.webp'}
          alt={abbreviation}
          width={imgSize}
          height={imgSize}
          className={`${imgClass} rounded-full object-cover border-2 border-border/50 relative z-10 transition-transform duration-300 group-hover/logo:scale-105`}
        />
      </div>
      <div className={`text-center ${align === 'right' ? 'lg:text-right' : align === 'left' ? 'lg:text-left' : ''}`}>
        <div className={`${moderniz.className} text-xl sm:text-2xl ${size === 'large' ? 'lg:text-3xl' : ''} font-bold text-foreground leading-tight tracking-wide`}>
          {abbreviation}
        </div>
        <div className={`${roboto.className} text-xs sm:text-sm text-muted-foreground/60 leading-tight mt-0.5 max-w-[140px] truncate`}>
          {name}
        </div>
      </div>
    </div>
  );
}

export default function UpcomingGames({ initialMatches }: UpcomingGamesProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const upcomingGames = initialMatches.map((match) => {
    const participants = match.match_participants || [];
    return {
      id: match.id,
      teamA: {
        name: participants[0]?.schools_teams?.school?.name || 'TBA',
        abbreviation: participants[0]?.schools_teams?.school?.abbreviation || 'TBA',
        logo: participants[0]?.schools_teams?.school?.logo_url || null
      },
      teamB: {
        name: participants[1]?.schools_teams?.school?.name || 'TBA',
        abbreviation: participants[1]?.schools_teams?.school?.abbreviation || 'TBA',
        logo: participants[1]?.schools_teams?.school?.logo_url || null
      },
      esport: match.esports_seasons_stages?.esports_categories?.esports,
      category: match.esports_seasons_stages?.esports_categories?.division || "Men's",
      stage: match.esports_seasons_stages?.competition_stage || 'Groupstage',
      date: match.scheduled_at || new Date().toISOString(),
      venue: match.venue || 'TBD',
      bestOf: match.best_of || 2,
      status: match.status
    };
  });

  const [featured, ...rest] = upcomingGames;

  if (!isMounted || upcomingGames.length === 0) {
    return (
      <section className="py-24 md:py-32 bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <h2 className={`${moderniz.className} text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6`}>
            Upcoming <span className="text-gradient-cel">Games</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto`}>
            {upcomingGames.length === 0
              ? 'No upcoming games scheduled. Check back soon for exciting matchups!'
              : 'Loading schedule...'}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 md:py-32 bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] -z-10" />

      <div className="container relative mx-auto px-4 z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20 backdrop-blur-sm">
            <Gamepad2 className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium tracking-wide">Match Schedule</span>
          </div>
          <h2 className={`${moderniz.className} text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6`}>
            Upcoming <span className="text-gradient-cel">Games</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light`}>
            Mark your calendars for the next epic showdowns in CESAFI esports
          </p>
        </motion.div>

        {/* Featured Match - Hero Card */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15, type: 'spring', stiffness: 100 }}
            className="mb-10 md:mb-14"
          >
            <Link href={`/matches/${featured.id}`} prefetch={false} className="block group">
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden border border-border/40 bg-card/60 hover:bg-card transition-all duration-500 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
                {/* Diagonal accent strip */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

                {/* Esport watermark */}
                {featured.esport?.logo_url && (
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none hidden lg:block">
                    <Image
                      src={featured.esport.logo_url}
                      alt=""
                      width={200}
                      height={200}
                      className="h-52 w-52 object-contain"
                    />
                  </div>
                )}

                <div className="relative p-6 sm:p-8 lg:p-10">
                  {/* Top bar: meta info */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                    <div className="flex items-center gap-3">
                      {featured.esport?.logo_url && (
                        <Image
                          src={featured.esport.logo_url}
                          alt={featured.esport.name || ''}
                          width={24}
                          height={24}
                          className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                        />
                      )}
                      <span className={`${roboto.className} text-sm text-muted-foreground`}>
                        {featured.esport?.name || 'Esports'} • {featured.category} • {featured.stage}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(featured.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      </div>
                      {featured.venue && featured.venue !== 'TBD' && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{featured.venue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main matchup display */}
                  <div className="grid grid-cols-3 items-center gap-4 lg:gap-8">
                    <TeamDisplay
                      name={featured.teamA.name}
                      abbreviation={featured.teamA.abbreviation}
                      logoUrl={featured.teamA.logo}
                      align="right"
                      size="large"
                    />

                    {/* Center: VS + Countdown */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg animate-pulse" />
                        <div className={`${moderniz.className} relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground text-xl sm:text-2xl font-black shadow-lg shadow-primary/25`}>
                          VS
                        </div>
                      </div>
                      <div className="hidden sm:block">
                        <CountdownTimer scheduledAt={featured.date} />
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium`}>
                        Best of {featured.bestOf}
                      </span>
                    </div>

                    <TeamDisplay
                      name={featured.teamB.name}
                      abbreviation={featured.teamB.abbreviation}
                      logoUrl={featured.teamB.logo}
                      align="left"
                      size="large"
                    />
                  </div>

                  {/* Countdown on mobile */}
                  <div className="sm:hidden mt-6 flex justify-center">
                    <CountdownTimer scheduledAt={featured.date} />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Other Matches - Horizontal Cards */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {rest.slice(0, 3).map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <Link href={`/matches/${game.id}`} prefetch={false} className="block group h-full">
                  <div className="relative h-full rounded-xl overflow-hidden border border-border/40 bg-card/60 hover:bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                    {/* Accent strip */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/40" />

                    <div className="p-5 pl-5">
                      {/* Top meta-badge */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          {game.esport?.logo_url && (
                            <Image
                              src={game.esport.logo_url}
                              alt={game.esport.name || ''}
                              width={18}
                              height={18}
                              className="h-4 w-4 object-contain"
                            />
                          )}
                          <span className={`${roboto.className} text-xs text-muted-foreground`}>
                            {game.esport?.name || 'Esports'} • {game.stage}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium bg-muted/50 px-2 py-0.5 rounded">
                          BO{game.bestOf}
                        </span>
                      </div>

                      {/* Match display - compact */}
                      <div className="flex items-center justify-between gap-3 mb-5">
                        <TeamDisplay
                          name={game.teamA.name}
                          abbreviation={game.teamA.abbreviation}
                          logoUrl={game.teamA.logo}
                        />

                        <div className={`${moderniz.className} text-lg font-black text-muted-foreground/30 flex-shrink-0`}>
                          VS
                        </div>

                        <TeamDisplay
                          name={game.teamB.name}
                          abbreviation={game.teamB.abbreviation}
                          logoUrl={game.teamB.logo}
                        />
                      </div>

                      {/* Bottom: date + venue */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/20">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <span className="text-xs text-muted-foreground/40">
                          {new Date(game.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* View All CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-10 md:mt-14"
        >
          <Link
            href="/schedule"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/25 group/btn"
          >
            <span className="uppercase tracking-wide text-sm">View Full Schedule</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}