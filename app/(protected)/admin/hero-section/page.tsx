import { getPaginatedHeroSectionLive } from '@/actions/hero-section';
import { HeroSectionTable } from '@/components/admin/hero-section/hero-section-table';

export default async function HeroSectionPage() {
  const heroSectionData = await getPaginatedHeroSectionLive({
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  return (
    <div className="w-full space-y-6">
      <HeroSectionTable
        initialData={
          heroSectionData.success && 'data' in heroSectionData ? heroSectionData.data : undefined
        }
      />
    </div>
  );
}
