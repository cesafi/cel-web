import ComingSoon from '@/components/shared/coming-soon';

export default function ArticlesPage() {
  return (
    <ComingSoon
      title="Articles & News"
      description="Stay updated with the latest CESAFI news, match reports, and sports stories."
      features={[
        'Latest match reports and analysis',
        'Player and team spotlights',
        'Tournament updates and results',
        'Behind-the-scenes stories',
        'Historical articles and achievements'
      ]}
      estimatedLaunch="Q1 2025"
    />
  );
}
