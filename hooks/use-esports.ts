import { useQuery } from '@tanstack/react-query';
import { getAllEsports, getAllEsportCategories } from '@/actions/esports';

export const esportKeys = {
  all: ['esports'] as const,
  categories: ['esports', 'categories'] as const,
};

export function useAllEsports() {
  return useQuery({
    queryKey: esportKeys.all,
    queryFn: async () => {
      const result = await getAllEsports();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useAllEsportCategories() {
  return useQuery({
    queryKey: esportKeys.categories,
    queryFn: async () => {
      const result = await getAllEsportCategories();
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
