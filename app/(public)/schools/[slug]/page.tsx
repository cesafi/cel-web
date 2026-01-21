import { notFound } from 'next/navigation';
import SchoolProfile from '@/components/schools/school-profile';

interface SchoolProfilePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function SchoolProfilePage({ params }: SchoolProfilePageProps) {
  const { slug } = await params;

  if (!slug) {
    notFound();
  }

  return <SchoolProfile schoolAbbreviation={slug} />;
}
