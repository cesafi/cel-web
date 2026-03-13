import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import TeamProfile from '@/components/schools/team-profile';
import { getSchoolByAbbreviation } from '@/actions/schools';

export const revalidate = 600; // Revalidate every 10 minutes

interface TeamProfilePageProps {
  params: Promise<{
    slug: string;
    teamSlug: string;
  }>;
}

export async function generateMetadata({ params }: TeamProfilePageProps): Promise<Metadata> {
  const { slug, teamSlug } = await params;
  const result = await getSchoolByAbbreviation(slug);

  const school = result.success && result.data ? (result.data as any) : null;
  const schoolName = school?.abbreviation || slug.toUpperCase();
  const teamName = decodeURIComponent(teamSlug).replace(/-/g, ' ');

  return {
    title: `${schoolName} ${teamName} | CESAFI Esports League`,
    description: `View the ${schoolName} ${teamName} roster, stats, and match results in the CESAFI Esports League.`,
  };
}

export default async function TeamProfilePage({ params }: TeamProfilePageProps) {
  const { slug, teamSlug } = await params;

  if (!slug || !teamSlug) {
    notFound();
  }

  return <TeamProfile schoolAbbreviation={slug} teamSlug={teamSlug} />;
}
