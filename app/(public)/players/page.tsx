import { moderniz, roboto } from '@/lib/fonts';
import { Users, Gamepad2, Trophy } from 'lucide-react';
import PlayersGrid from '@/components/players/players-grid';
import { getAvailableSportCategories } from '@/actions/matches';

export const metadata = {
  title: 'Players | CESAFI Esports League',
  description: 'Browse all CESAFI esports competitors across MLBB and Valorant teams and seasons.'
};

export const revalidate = 1800; // Revalidate every 30 minutes

export default async function PlayersPage() {
  const categoriesResult = await getAvailableSportCategories();
  const availableRichSports = categoriesResult.success && categoriesResult.data ? categoriesResult.data : [];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[40vh] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 pt-16 sm:min-h-[50vh] sm:pt-20">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzM2YzYxIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          <div className="text-center">
            <h1 className={`${moderniz.className} text-3xl font-bold text-foreground mb-4 sm:text-4xl sm:mb-6 md:text-6xl lg:text-7xl`}>
              Meet Our
              <span className="block text-primary">Players</span>
            </h1>
            <p className={`${roboto.className} text-base text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed sm:text-lg sm:mb-12 md:text-xl`}>
              Browse competitors across MLBB and Valorant. Select a game, season, and
              team to explore individual player stats and profiles.
            </p>
          </div>
        </div>
      </section>

      {/* Players content with cascading filters (all client-side) */}
      <PlayersGrid availableRichSports={availableRichSports as any} />
    </>
  );
}
