import { Suspense } from 'react';
import { StatisticsContent } from '@/components/statistics/statistics-content';
import { StatisticsLoading } from '@/components/statistics/statistics-loading';

export const metadata = {
  title: 'Statistics | CESAFI Esports League',
  description: 'Player statistics and leaderboards for MLBB and Valorant'
};

export default function StatisticsPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Player <span className="text-gradient-cel">Statistics</span></h1>
      <Suspense fallback={<StatisticsLoading />}>
        <StatisticsContent />
      </Suspense>
    </main>
  );
}
