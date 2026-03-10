import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import PlayerProfile from '@/components/players/player-profile';
import { getPlayerBySlug } from '@/actions/players';

interface PlayerProfilePageProps {
  params: Promise<{
    playerSlug: string;
  }>;
}

export async function generateMetadata({ params }: PlayerProfilePageProps): Promise<Metadata> {
  const { playerSlug } = await params;
  const ign = decodeURIComponent(playerSlug);
  const result = await getPlayerBySlug(playerSlug);

  if (!result.success || !result.data) {
    return { title: 'Player Not Found | CESAFI Esports League' };
  }

  const player = result.data as any;
  const name = player.ign || ign;
  const school = player.schools_teams?.school?.abbreviation || '';

  return {
    title: `${name}${school ? ` - ${school}` : ''} | CESAFI Esports League`,
    description: `View ${name}'s player profile, stats, and match history in the CESAFI Esports League.`,
  };
}

export default async function PlayerProfilePage({ params }: PlayerProfilePageProps) {
  const { playerSlug } = await params;

  if (!playerSlug) {
    notFound();
  }

  return <PlayerProfile playerIGN={decodeURIComponent(playerSlug)} />;
}
