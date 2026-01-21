import { useQuery } from '@tanstack/react-query';
import { getAllEsportsSeasonsStages } from '@/actions/esports-seasons-stages';

export const esportsSeasonStageKeys = {
  all: ['esports-seasons-stages'] as const,
};

export function useAllEsportsSeasonsStages() {
  return useQuery({
    queryKey: esportsSeasonStageKeys.all,
    queryFn: async () => {
      const result = await getAllEsportsSeasonsStages();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
