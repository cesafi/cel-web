import { notFound } from 'next/navigation';
import TeamProfile from '@/components/schools/team-profile';

interface TeamProfilePageProps {
  params: Promise<{
    slug: string;
    teamId: string;
  }>;
}

export default async function TeamProfilePage({ params }: TeamProfilePageProps) {
  const { slug, teamId } = await params;

  if (!slug || !teamId) {
    notFound();
  }

  return <TeamProfile schoolAbbreviation={slug} teamId={teamId} />;
}
