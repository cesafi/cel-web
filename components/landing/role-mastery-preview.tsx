import { RoleMasteryToggle } from '@/components/landing/role-mastery-toggle';
import { getRoleMastery } from '@/actions/statistics';
import { getCurrentSeason } from '@/actions/seasons';
import { ArrowRight } from 'lucide-react';
import { moderniz, roboto } from '@/lib/fonts';
import Link from 'next/link';

export default async function RoleMasteryPreview() {
  const activeSeasonResult = await getCurrentSeason();
  const seasonId = activeSeasonResult.success && activeSeasonResult.data ? activeSeasonResult.data.id : undefined;

  // Default: MLBB EXP role, Men's division
  const defaultGame = 'mlbb' as const;
  const defaultRole = 'EXP';

  const result = await getRoleMastery(defaultGame, defaultRole, 3, seasonId, "Men's", 3);
  const initialData = result.data || [];

  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Dynamic background effects */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] -z-10 mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] -z-10 mix-blend-screen" />

      <div className="container relative mx-auto px-4 z-10">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className={`${moderniz.className} text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6`}>
            Role <span className="text-primary">Mastery</span>
          </h2>
          <p className={`${roboto.className} text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto font-light`}>
            Discover who dominates each position with our composite scoring system
          </p>
        </div>

        {/* Interactive Role Mastery Toggle */}
        <RoleMasteryToggle
          initialData={initialData}
          initialGame={defaultGame}
          initialRole={defaultRole}
          seasonId={seasonId}
        />

        {/* View All Button */}
        <div className="text-center mt-10 md:mt-12 flex flex-col gap-3 sm:gap-4 justify-center">
          <Link href="/statistics">
            <button className={`${roboto.className} bg-foreground hover:bg-foreground/90 text-background px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center`}>
              View Full Role Rankings
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <p className={`${roboto.className} text-sm text-muted-foreground`}>
            Deep-dive into all positions with full stat breakdowns
          </p>
        </div>
      </div>
    </section>
  );
}
