import { Suspense } from 'react';
import StandingsContent from '@/components/standings/standings-content';
import StandingsLoading from '@/components/standings/standings-loading';
import {
  getAvailableSeasons,
  getAvailableSports,
  getAvailableCategories,
  getStandingsNavigation
} from '@/actions/standings';
import { findItemBySlug, fromSlug, normalizeStageSlug } from '@/lib/slug-utils';

function StandingsLoadingFallback() {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <StandingsLoading className="min-h-0 bg-transparent" />
    </div>
  );
}

export const revalidate = 900; // Revalidate every 15 minutes

interface StandingsPageProps {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StandingsPage({ params, searchParams }: StandingsPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slugs = resolvedParams.slug || [];

  // Resolution State
  let seasonId: number | undefined;
  let sportId: number | undefined;
  let categoryId: number | undefined;
  let stageId: number | undefined;

  // 1. Resolve Season (Slug index 0)
  const seasonsResponse = await getAvailableSeasons();
  const seasons = seasonsResponse.success ? seasonsResponse.data : [];

  if (slugs[0]) {
    const season = findItemBySlug(seasons || [], slugs[0]);
    seasonId = season?.id;
  } else if (resolvedSearchParams.season) {
    seasonId = Number(resolvedSearchParams.season);
  }

  // Valid Season Required for further resolution
  if (seasonId) {
    // 2. Resolve Sport (Slug index 1)
    const sportsResponse = await getAvailableSports(seasonId);
    const sports = sportsResponse.success ? sportsResponse.data : [];

    if (slugs[1]) {
      const sport = findItemBySlug(sports || [], slugs[1]);
      sportId = sport?.id;
    } else if (resolvedSearchParams.sport) {
      sportId = Number(resolvedSearchParams.sport);
    }

    // Valid Sport Required for further resolution
    if (sportId) {
      // 3. Resolve Category (Slug index 2)
      const categoriesResponse = await getAvailableCategories(seasonId, sportId);
      const categories = categoriesResponse.success ? categoriesResponse.data : [];

      if (slugs[2]) {
        const category = findItemBySlug(categories || [], slugs[2]);
        categoryId = category?.id;
      } else if (resolvedSearchParams.category) {
        categoryId = Number(resolvedSearchParams.category);
      }

      // 4. Resolve Stage (Slug index 3)
      // We need category to be mostly sure, but stage is tied to season/sport generally in navigation 
      // passing category makes it more precise
      if (categoryId) {
        const filters = {
          season_id: seasonId,
          sport_id: sportId,
          esport_category_id: categoryId
        };
        const navResponse = await getStandingsNavigation(filters);
        const stages = navResponse.success ? navResponse.data?.stages : [];

        if (slugs[3]) {
          const targetStageSlug = normalizeStageSlug(slugs[3]);
          const stage = stages?.find(s =>
            normalizeStageSlug(s.competition_stage) === targetStageSlug
          );
          stageId = stage?.id;
        } else if (resolvedSearchParams.stage) {
          stageId = Number(resolvedSearchParams.stage);
        }
      }
    }
  }

  // Construct initial filters (undefined values are fine, StandingsContent handles them)
  const initialFilters = {
    season_id: seasonId,
    sport_id: sportId,
    esport_category_id: categoryId,
    stage_id: stageId
  };

  return (
    <Suspense fallback={<StandingsLoadingFallback />}>
      <StandingsContent
        searchParams={resolvedSearchParams as any}
        initialFilters={initialFilters}
      />
    </Suspense>
  );
}
