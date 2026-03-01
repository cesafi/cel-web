'use client';

import { useParams } from 'next/navigation';
import { useAllEsports } from '@/hooks/use-esports';
import { useMemo } from 'react';
import { CharactersPage } from '@/components/admin/game-characters';

export default function AdminCharactersManagementPage() {
  const params = useParams();
  const gameSlug = params.gameSlug as string;

  const { data: esports = [] } = useAllEsports();

  const currentEsport = useMemo(() => {
    if (!esports.length) return undefined;
    return esports.find(e => 
      e.abbreviation?.toLowerCase() === gameSlug?.toLowerCase() || 
      e.id.toString() === gameSlug
    );
  }, [esports, gameSlug]);

  return (
    <CharactersPage 
      gameSlug={gameSlug}
      title="Character Management" 
      subtitle={currentEsport ? `Add, edit, and manage ${currentEsport.name} characters in your database.` : 'Manage game characters.'}
    />
  );
}
