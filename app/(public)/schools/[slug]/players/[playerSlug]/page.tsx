import { redirect } from 'next/navigation';

interface PlayerProfilePageProps {
  params: Promise<{
    slug: string;
    playerSlug: string;
  }>;
}

export default async function PlayerProfileRedirect({ params }: PlayerProfilePageProps) {
  const { playerSlug } = await params;
  redirect(`/players/${playerSlug}`);
}
