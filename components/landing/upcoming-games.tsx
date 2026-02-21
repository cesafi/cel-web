'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Calendar, MapPin, Trophy, Clock } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import { MatchWithFullDetails } from '@/lib/types/matches';

interface UpcomingGamesProps {
  initialMatches: MatchWithFullDetails[];
}

export default function UpcomingGames({ initialMatches }: UpcomingGamesProps) {
  const [isMounted, setIsMounted] = useState(false);

  const upcomingGames = initialMatches.map((match) => {
    // Handle multiple participants (for sports like Track and Field)
    const participants = match.match_participants || [];

    // For most sports, we expect 2 participants (home and away)
    // For sports with more participants, we'll show the first two
    const homeTeam = participants[0]?.schools_teams?.school?.name || 'Team A';
    const awayTeam = participants[1]?.schools_teams?.school?.name || 'Team B';

    return {
      id: match.id,
      homeTeam,
      awayTeam,
      sport: match.esports_seasons_stages?.esports_categories?.esports?.name || 'Basketball',
      date: match.scheduled_at || new Date().toISOString(),
      time: match.scheduled_at ? new Date(match.scheduled_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) : '18:00',
      venue: match.venue || 'Cebu Coliseum',
      status: 'upcoming',
      category: `${match.esports_seasons_stages?.esports_categories?.division || 'Men'}'s Division`,
      // Additional info for multi-participant sports
      totalParticipants: participants.length,
      allParticipants: participants.map(p => p.schools_teams?.school?.name).filter(Boolean)
    };
  });

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render scroll-based animations until mounted
  if (!isMounted) {
    return (
      <section className="py-32 bg-background relative overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className={`${moderniz.className} text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-8 leading-tight`}>
              UPCOMING
              <br />
              <span className="text-primary">GAMES</span>
            </h2>
            <p className={`${roboto.className} text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed`}>
              Witness the most thrilling athletic competitions in Cebu.
              Mark your calendars for these epic showdowns.
            </p>
          </div>
          {/* Static content without animations */}
          {upcomingGames.length > 0 ? (
            <div className="space-y-8">
              {/* Featured Game */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-8 lg:p-12 border border-primary/20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                  <div className="text-center lg:text-right">
                    <div className={`${roboto.className} text-2xl lg:text-3xl font-bold text-foreground mb-4`}>
                      {upcomingGames[0].homeTeam}
                    </div>
                    <div className={`${roboto.className} text-lg text-muted-foreground`}>
                      Home Team
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </div>
                    <div className={`${roboto.className} text-2xl font-bold text-primary mb-2`}>
                      VS
                    </div>
                    <div className={`${roboto.className} text-sm text-muted-foreground mb-4`}>
                      {upcomingGames[0].sport} • {upcomingGames[0].category}
                    </div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className={`${roboto.className} text-2xl lg:text-3xl font-bold text-foreground mb-4`}>
                      {upcomingGames[0].awayTeam}
                    </div>
                    <div className={`${roboto.className} text-lg text-muted-foreground`}>
                      Away Team
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className={`${roboto.className} text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed`}>
                No upcoming games scheduled at the moment. Check back soon for exciting matchups!
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Handle case when there are no upcoming games
  if (upcomingGames.length === 0) {
    return (
      <section className="py-32 bg-background relative overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className={`${moderniz.className} text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-8 leading-tight`}>
              UPCOMING
              <br />
              <span className="text-primary">GAMES</span>
            </h2>
            <p className={`${roboto.className} text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed`}>
              No upcoming games scheduled at the moment. Check back soon for exciting matchups!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-32 bg-background relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className={`${moderniz.className} text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-8 leading-tight`}>
            UPCOMING
            <br />
            <span className="text-primary">GAMES</span>
          </h2>
          <p className={`${roboto.className} text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed`}>
            Witness the most thrilling athletic competitions in Cebu.
            Mark your calendars for these epic showdowns.
          </p>
        </div>

        {/* Featured Game - Large Display */}
        {upcomingGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-3xl p-8 lg:p-12 border border-primary/20">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">

                {/* Team 1 */}
                <div className="text-center lg:text-right">
                  <div className={`${roboto.className} text-2xl lg:text-3xl font-bold text-foreground mb-4`}>
                    {upcomingGames[0].homeTeam}
                  </div>
                  <div className={`${roboto.className} text-lg text-muted-foreground`}>
                    Home Team
                  </div>
                </div>

                {/* VS Section */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <div className={`${roboto.className} text-2xl font-bold text-primary mb-2`}>
                    VS
                  </div>
                  <div className={`${roboto.className} text-sm text-muted-foreground mb-4`}>
                    {upcomingGames[0].sport} • {upcomingGames[0].category}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(upcomingGames[0].date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{upcomingGames[0].time}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{upcomingGames[0].venue}</span>
                  </div>
                </div>

                {/* Team 2 */}
                <div className="text-center lg:text-left">
                  <div className={`${roboto.className} text-2xl lg:text-3xl font-bold text-foreground mb-4`}>
                    {upcomingGames[0].awayTeam}
                  </div>
                  <div className={`${roboto.className} text-lg text-muted-foreground`}>
                    Away Team
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Other Games - Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {upcomingGames.slice(1, 4).map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-muted/30 rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 group hover:shadow-lg"
            >
              {/* Sport Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className={`${roboto.className} text-sm font-medium text-primary`}>
                    {game.sport}
                  </span>
                </div>
                <span className={`${roboto.className} text-xs px-3 py-1 bg-primary/10 text-primary rounded-full`}>
                  {game.category}
                </span>
              </div>

              {/* Teams */}
              <div className="text-center mb-6">
                <div className={`${roboto.className} text-lg font-bold text-foreground mb-2`}>
                  {game.homeTeam}
                </div>
                <div className={`${roboto.className} text-xl font-bold text-primary mb-2`}>
                  VS
                </div>
                <div className={`${roboto.className} text-lg font-bold text-foreground`}>
                  {game.awayTeam}
                </div>
              </div>

              {/* Game Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className={`${roboto.className} text-sm`}>
                    {new Date(game.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className={`${roboto.className} text-sm`}>
                    {game.time}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className={`${roboto.className} text-sm`}>
                    {game.venue}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <button className={`${roboto.className} w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-semibold text-sm uppercase tracking-wide transition-all duration-200 hover:scale-105 shadow-lg`}>
                View Details
              </button>
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <button className={`${roboto.className} bg-foreground hover:bg-foreground/90 text-background px-10 py-5 rounded-2xl font-semibold text-xl uppercase tracking-wide transition-all duration-300 hover:scale-105 shadow-lg`}>
            View All Games
          </button>
        </motion.div>
      </div>
    </section>
  );
}