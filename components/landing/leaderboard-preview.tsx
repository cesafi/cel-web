import { LeaderboardCard } from '@/components/statistics/leaderboard-card';
import { getLeaderboard } from '@/actions/statistics';
import { getCurrentSeason } from '@/actions/seasons';
import { TrendingUp } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default async function LeaderboardPreview() {
  // First fetch the current active season
  const activeSeasonResult = await getCurrentSeason();
  const seasonId = activeSeasonResult.success && activeSeasonResult.data ? activeSeasonResult.data.id : undefined;

  // Fetch top stats in parallel with seasonId filter
  const [
    mlbbRating,
    valorantAcs,
    mlbbMvp,
    valorantMvp
  ] = await Promise.all([
    getLeaderboard('mlbb', 'avg_rating', 5, seasonId),
    getLeaderboard('valorant', 'avg_acs', 5, seasonId),
    getLeaderboard('mlbb', 'mvp_count', 5, seasonId),
    getLeaderboard('valorant', 'mvp_count', 5, seasonId)
  ]);

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] -z-10 mix-blend-screen" />

      <div className="container relative mx-auto px-4 z-10">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 border border-primary/20 backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium tracking-wide">Live Rankings</span>
          </div>
          <h2 className={`${moderniz.className} text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6`}>
            Top <span className="text-gradient-cel">Performers</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light`}>
            The elite players dominating CESAFI esports this season
          </p>
        </div>

        {/* Leaderboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto">
          <LeaderboardCard
            title="Combat Score"
            game="valorant"
            metric="ACS"
            data={valorantAcs.data || []}
            iconImage="/img/valorant.webp"
            accentColor="red"
            delay={0.1}
          />

          <LeaderboardCard
            title="Average Rating"
            game="mlbb"
            metric="Rating"
            data={mlbbRating.data || []}
            iconImage="/img/mlbb.webp"
            accentColor="blue"
            delay={0.2}
          />

          <LeaderboardCard
            title="MVP Race"
            game="valorant"
            metric="MVPs"
            data={valorantMvp.data || []}
            iconImage="/img/valorant.webp"
            accentColor="yellow"
            delay={0.3}
          />

          <LeaderboardCard
            title="MVP Race"
            game="mlbb"
            metric="MVPs"
            data={mlbbMvp.data || []}
            iconImage="/img/mlbb.webp"
            accentColor="yellow"
            delay={0.4}
          />
        </div>

        {/* View All Button */}
        <div className="text-center mt-10 md:mt-12">
          <Link
            href="/statistics"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/25"
          >
            View Full Statistics
            <TrendingUp className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
