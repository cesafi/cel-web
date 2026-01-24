import { LeaderboardCard } from '@/components/statistics/leaderboard-card';
import { getLeaderboard } from '@/actions/statistics';
import { Crosshair, Swords, Zap, Trophy, TrendingUp } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import Link from 'next/link';

export default async function LeaderboardPreview() {
  // Fetch top stats in parallel
  const [
    mlbbKills,
    valorantAcs,
    mlbbMvp
  ] = await Promise.all([
    getLeaderboard('mlbb', 'total_kills', 5),
    getLeaderboard('valorant', 'avg_acs', 5),
    getLeaderboard('mlbb', 'mvp_count', 5)
  ]);

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Live Rankings</span>
          </div>
          <h2 className={`${moderniz.className} text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4`}>
            Top <span className="text-gradient-cel">Performers</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-base md:text-lg max-w-2xl mx-auto`}>
            The elite players dominating CESAFI esports this season
          </p>
        </div>

        {/* Leaderboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <LeaderboardCard
            title="Combat Score"
            game="valorant"
            metric="ACS"
            data={valorantAcs.data || []}
            icon={<Crosshair className="h-5 w-5" />}
            accentColor="red"
          />

          <LeaderboardCard
            title="Total Kills"
            game="mlbb"
            metric="Kills"
            data={mlbbKills.data || []}
            icon={<Swords className="h-5 w-5" />}
            accentColor="blue"
          />

          <LeaderboardCard
            title="MVP Race"
            game="mlbb"
            metric="MVPs"
            data={mlbbMvp.data || []}
            icon={<Trophy className="h-5 w-5" />}
            accentColor="yellow"
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
