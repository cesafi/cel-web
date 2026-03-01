'use client';

import { useParams } from 'next/navigation';
import { MapsPage as ValorantMapsPage } from '@/components/admin/valorant-maps';
import { MapsPage as MlbbMapsPage } from '@/components/admin/mlbb-maps';

export default function LeagueOperatorMapsManagementPage() {
  const params = useParams();
  const gameSlug = params.gameSlug as string;

  const isMlbb = gameSlug === 'mobile-legends' || gameSlug === 'mlbb';

  if (isMlbb) {
    return <MlbbMapsPage />;
  }

  // Default to Valorant maps for other slugs like 'valo', 'valorant'
  return (
    <ValorantMapsPage 
      title="VALORANT Maps Management" 
      subtitle="Add, edit, and manage VALORANT maps for the league." 
    />
  );
}
