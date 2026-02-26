import { notFound } from 'next/navigation';
import PlayerProfile from '@/components/players/player-profile';

interface PlayerProfilePageProps {
  params: Promise<{
    slug: string;
    playerSlug: string;
  }>;
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { slug, playerSlug } = await params;

  if (!slug || !playerSlug) {
    notFound();
  }

  return <PlayerProfile schoolSlug={slug} playerIGN={decodeURIComponent(playerSlug)} />;
}
