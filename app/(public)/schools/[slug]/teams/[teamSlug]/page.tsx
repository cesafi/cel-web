import { notFound } from 'next/navigation';
import TeamProfile from '@/components/schools/team-profile';

interface TeamProfilePageProps {
  params: Promise<{
    slug: string;
    teamSlug: string;
  }>;
}

export default async function TeamProfilePage({ params }: TeamProfilePageProps) {
  const { slug, teamSlug } = await params;

  if (!slug || !teamSlug) {
    notFound();
  }

  return <TeamProfile schoolAbbreviation={slug} teamSlug={teamSlug} />;
}
