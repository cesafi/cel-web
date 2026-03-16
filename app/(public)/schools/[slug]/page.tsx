import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import SchoolProfile from '@/components/schools/school-profile';
import { getSchoolByAbbreviation } from '@/actions/schools';

export const revalidate = 600; // Revalidate every 10 minutes

interface SchoolProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: SchoolProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getSchoolByAbbreviation(slug);

  if (!result.success || !result.data) {
    return { title: 'School Not Found | CESAFI Esports League' };
  }

  const school = result.data as any;
  const name = school.name || slug;
  const abbreviation = school.abbreviation || slug;

  return {
    title: `${abbreviation} - ${name} | CESAFI Esports League`,
    description: `Explore ${name} (${abbreviation})'s esports teams, players, and match history in the CESAFI Esports League.`,
  };
}

export default async function SchoolProfilePage({ params }: SchoolProfilePageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return <SchoolProfile schoolAbbreviation={slug} />;
}
