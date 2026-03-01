'use client';

import { useParams } from 'next/navigation';
import { CharactersPage } from '@/components/admin/game-characters';

export default function LeagueOperatorCharactersManagementPage() {
  const params = useParams();
  const gameSlug = params.gameSlug as string;

  return (
    <CharactersPage 
      gameSlug={gameSlug}
      title="Characters Management" 
      subtitle={`Manage characters/heroes for ${gameSlug.toUpperCase()}.`} 
    />
  );
}
