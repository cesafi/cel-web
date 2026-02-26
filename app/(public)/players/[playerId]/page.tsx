import { notFound } from 'next/navigation';
import PlayerProfile from '@/components/players/player-profile';

interface PlayerProfilePageProps {
  params: Promise<{
    playerId: string;
  }>;
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { playerId } = await params;

  if (!playerId) {
    notFound();
  }

  return <PlayerProfile playerId={playerId} />;
}
