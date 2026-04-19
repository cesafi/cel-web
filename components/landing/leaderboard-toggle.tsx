'use client';

import { useState, useTransition } from 'react';
import { LeaderboardCard } from '@/components/statistics/leaderboard-card';
import { LeaderboardEntry } from '@/services/statistics';
import { getLeaderboard } from '@/actions/statistics';
import { cn } from '@/lib/utils';
import { roboto } from '@/lib/fonts';
import { Loader2 } from 'lucide-react';

type Division = "Men's" | "Women's";

interface LeaderboardData {
  mlbbRating: LeaderboardEntry[];
  valorantAcs: LeaderboardEntry[];
  mlbbMvp: LeaderboardEntry[];
  valorantMvp: LeaderboardEntry[];
}

interface LeaderboardToggleProps {
  initialData: LeaderboardData;
  seasonId?: number;
}

export function LeaderboardToggle({ initialData, seasonId }: LeaderboardToggleProps) {
  const [division, setDivision] = useState<Division>("Men's");
  const [data, setData] = useState<LeaderboardData>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (newDivision: Division) => {
    if (newDivision === division) return;
    setDivision(newDivision);

    startTransition(async () => {
      const isMens = newDivision === "Men's";
      const minGames = isMens ? 5 : undefined;
      const [mlbbRating, valorantAcs, mlbbMvp, valorantMvp] = await Promise.all([
        getLeaderboard('mlbb', 'avg_rating', 5, seasonId, newDivision, minGames),
        getLeaderboard('valorant', 'avg_acs', 5, seasonId, newDivision, minGames),
        getLeaderboard('mlbb', 'mvp_count', 5, seasonId, newDivision, minGames),
        getLeaderboard('valorant', 'mvp_count', 5, seasonId, newDivision, minGames),
      ]);

      setData({
        mlbbRating: mlbbRating.data || [],
        valorantAcs: valorantAcs.data || [],
        mlbbMvp: mlbbMvp.data || [],
        valorantMvp: valorantMvp.data || [],
      });
    });
  };

  return (
    <>
      {/* Conditional indicator for Men's */}
      {division === "Men's" && (
        <p className="text-sm tracking-wider text-muted-foreground/80 text-center mb-6 mt-3 animate-in fade-in duration-300">
          (Regular Season &amp; Minimum 5 Games Played)
        </p>
      )}

      {/* Division Toggle */}
      <div className="flex justify-center mb-10 md:mb-14">
        <div className="relative inline-flex items-center rounded-2xl bg-muted/40 border border-border/40 p-1.5 backdrop-blur-sm">
          {/* Sliding indicator */}
          <div
            className={cn(
              'absolute top-1.5 bottom-1.5 rounded-xl bg-foreground shadow-lg transition-all duration-300 ease-out',
              division === "Men's" ? 'left-1.5 right-1/2' : 'left-1/2 right-1.5'
            )}
          />
          <button
            onClick={() => handleToggle("Men's")}
            className={cn(
              `${roboto.className} relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-colors duration-300 min-w-[120px]`,
              division === "Men's"
                ? 'text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Men&apos;s
          </button>
          <button
            onClick={() => handleToggle("Women's")}
            className={cn(
              `${roboto.className} relative z-10 px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-colors duration-300 min-w-[120px]`,
              division === "Women's"
                ? 'text-background'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Women&apos;s
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Leaderboard Cards Grid */}
        <div className={cn(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto transition-opacity duration-300',
          isPending && 'opacity-40'
        )}>
          <LeaderboardCard
            title="MVP Race"
            game="valorant"
            metric="MVPs"
            data={data.valorantMvp}
            iconImage="/img/valorant.webp"
            accentColor="yellow"
            delay={0.1}
          />

          <LeaderboardCard
            title="MVP Race"
            game="mlbb"
            metric="MVPs"
            data={data.mlbbMvp}
            iconImage="/img/mlbb.webp"
            accentColor="yellow"
            delay={0.2}
          />

          <LeaderboardCard
            title="Average Rating"
            game="mlbb"
            metric="Rating"
            data={data.mlbbRating}
            iconImage="/img/mlbb.webp"
            accentColor="blue"
            delay={0.3}
          />

          <LeaderboardCard
            title="Combat Score"
            game="valorant"
            metric="ACS"
            data={data.valorantAcs}
            iconImage="/img/valorant.webp"
            accentColor="red"
            delay={0.4}
          />
        </div>
      </div>
    </>
  );
}
