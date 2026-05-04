import { LeaderboardToggle } from '@/components/landing/leaderboard-toggle';
import { getLeaderboard } from '@/actions/statistics';
import { getLatestOrOngoingSeason } from '@/actions/seasons';
import { ArrowRight } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import Link from 'next/link';

export default async function LeaderboardPreview() {
  // First fetch the current active or latest season
  const activeSeasonResult = await getLatestOrOngoingSeason();
  const seasonId = activeSeasonResult.success && activeSeasonResult.data ? activeSeasonResult.data.id : undefined;

  // Default to Men's division, fetch top stats in parallel with seasonId filter
  const [
    mlbbRating,
    valorantAcs,
    mlbbMvp,
    valorantMvp
  ] = await Promise.all([
    getLeaderboard('mlbb', 'avg_rating', 5, seasonId, "Men's", 5),
    getLeaderboard('valorant', 'avg_acs', 5, seasonId, "Men's", 5),
    getLeaderboard('mlbb', 'mvp_count', 5, seasonId, "Men's", 5),
    getLeaderboard('valorant', 'mvp_count', 5, seasonId, "Men's", 5)
  ]);

  const initialData = {
    mlbbRating: mlbbRating.data || [],
    valorantAcs: valorantAcs.data || [],
    mlbbMvp: mlbbMvp.data || [],
    valorantMvp: valorantMvp.data || [],
  };

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] -z-10 mix-blend-screen" />

      <div className="container relative mx-auto px-4 z-10">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className={`${moderniz.className} text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6`}>
            Top <span className="text-primary">Performers</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light`}>
            The elite players dominating CESAFI esports this season
          </p>
        </div>

        {/* Division Toggle + Leaderboard Cards */}
        <LeaderboardToggle initialData={initialData} seasonId={seasonId} />

        {/* View All Button */}
        <div className="text-center mt-10 md:mt-12 flex flex-col gap-3 sm:gap-4 justify-center">
          <Link href="/statistics">
            <button className={`${roboto.className} bg-foreground hover:bg-foreground/90 text-background px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center`}>
              View Full Statistics
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <p className={`${roboto.className} text-sm text-muted-foreground`}>
            Explore comprehensive player stats, team standings, and match data
          </p>
        </div>
      </div>
    </section>
  );
}