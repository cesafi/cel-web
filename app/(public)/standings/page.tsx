import { Suspense } from 'react';
import { Metadata } from 'next';
import StandingsContent from '@/components/standings/standings-content';
import StandingsLoading from '@/components/standings/standings-loading';

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
    <Suspense fallback={<StandingsLoading />}>
      <StandingsContent searchParams={searchParams} />
    </Suspense>
  );
}
