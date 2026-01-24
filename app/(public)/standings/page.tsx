import { Suspense } from 'react';
import { Metadata } from 'next';
import StandingsContent from '@/components/standings/standings-content';
import StandingsLoading from '@/components/standings/standings-loading';
import { moderniz, roboto } from '@/lib/fonts';

export const metadata: Metadata = {
  title: 'Standings - CESAFI',
  description:
    'View current standings and tournament brackets for all CESAFI sports competitions across different seasons and categories.',
  keywords: ['CESAFI', 'standings', 'tournament', 'bracket', 'sports', 'competition', 'ranking']
};

interface StandingsPageProps {
  readonly searchParams: {
    readonly season?: string;
    readonly sport?: string;
    readonly category?: string;
    readonly stage?: string;
  };
}

export default function StandingsPage({ searchParams }: StandingsPageProps) {
  return (
    <>
      {/* Hero Section */}
      <section className="from-primary/10 via-background to-secondary/10 relative bg-gradient-to-br pt-20 pb-12 sm:pt-24 sm:pb-16">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzM2YzYxIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className={`${moderniz.className} uppercase text-foreground mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl md:text-6xl lg:text-7xl`}>
              League <span className="text-gradient-cel">Standings</span>
            </h1>
            <p className={`${roboto.className} text-base text-muted-foreground max-w-2xl mx-auto sm:text-lg`}>
              View current standings and tournament brackets for all CESAFI sports competitions.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<StandingsLoading />}>
          <StandingsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}
