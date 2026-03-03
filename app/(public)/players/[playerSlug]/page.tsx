import { notFound } from 'next/navigation';
import PlayerProfile from '@/components/players/player-profile';

interface PlayerProfilePageProps {
  params: Promise<{
    playerSlug: string;
  }>;
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { playerSlug } = await params;

  if (!playerSlug) {
    notFound();
  }

  return <PlayerProfile playerIGN={decodeURIComponent(playerSlug)} />;
}
