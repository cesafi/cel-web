import { LeaderboardCard } from '@/components/statistics/leaderboard-card';
import { getLeaderboard } from '@/actions/statistics';
import { Crosshair, Swords, Zap } from 'lucide-react';

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
    <section className="py-16 bg-zinc-50 dark:bg-zinc-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Top Performers</h2>
          <p className="text-muted-foreground">The best players dominating the league this season.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <LeaderboardCard 
            title="Avg Combat Score" 
            game="valorant" 
            metric="ACS"
            data={valorantAcs.data || []}
            icon={<Crosshair className="h-5 w-5 text-red-500" />}
          />
          
          <LeaderboardCard 
            title="Top Kills" 
            game="mlbb" 
            metric="Kills"
            data={mlbbKills.data || []}
            icon={<Swords className="h-5 w-5 text-blue-500" />}
          />
          
          <LeaderboardCard 
            title="MVP Race" 
            game="mlbb" 
            metric="MVPs"
            data={mlbbMvp.data || []}
            icon={<Zap className="h-5 w-5 text-yellow-500" />}
          />
        </div>
      </div>
    </section>
  );
}
