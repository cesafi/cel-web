import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getPaginatedFaq, 
  getAllFaq, 
  getHighlightedFaq,
  getAboutUsFaq,
  getFaqById, 
  createFaq, 
  updateFaq, 
  deleteFaq, 
  reorderFaq 
} from '@/actions/faq';
import { FaqPaginationOptions, FaqInsert, FaqUpdate } from '@/lib/types/faq';

// Query keys
export const faqKeys = {
  all: ['faq'] as const,
  paginated: (options: FaqPaginationOptions) => [...faqKeys.all, 'paginated', options] as const,
  allItems: () => [...faqKeys.all, 'all'] as const,
  byId: (id: number) => [...faqKeys.all, 'byId', id] as const,
};

/**
 * Hook to fetch paginated FAQ items
 */
export function usePaginatedFaq(options: FaqPaginationOptions) {
  return useQuery({
    queryKey: faqKeys.paginated(options),
    queryFn: () => getPaginatedFaq(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch all FAQ items (for public display)
 */
export function useAllFaq() {
  return useQuery({
    queryKey: faqKeys.allItems(),
    queryFn: getAllFaq,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch highlighted FAQ items (for landing page)
 */
export function useHighlightedFaq() {
  return useQuery({
    queryKey: [...faqKeys.all, 'highlighted'] as const,
    queryFn: getHighlightedFaq,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch About Us FAQ items (General and Events categories)
 */
export function useAboutUsFaq() {
  return useQuery({
    queryKey: [...faqKeys.all, 'aboutUs'] as const,
    queryFn: getAboutUsFaq,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch FAQ by ID
 */
export function useFaqById(id: number) {
  return useQuery({
    queryKey: faqKeys.byId(id),
    queryFn: () => getFaqById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to create FAQ item
 */
export function useCreateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FaqInsert) => createFaq(data),
    onSuccess: () => {
      // Invalidate all FAQ queries
      queryClient.invalidateQueries({ queryKey: faqKeys.all });
    },
  });
}

/**
 * Hook to update FAQ item
 */
export function useUpdateFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FaqUpdate }) => updateFaq(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate all FAQ queries
      queryClient.invalidateQueries({ queryKey: faqKeys.all });
      // Invalidate specific FAQ item
      queryClient.invalidateQueries({ queryKey: faqKeys.byId(id) });
    },
  });
}

/**
 * Hook to delete FAQ item
 */
export function useDeleteFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteFaq(id),
    onSuccess: () => {
      // Invalidate all FAQ queries
      queryClient.invalidateQueries({ queryKey: faqKeys.all });
    },
  });
}

/**
 * Hook to reorder FAQ items
 */
export function useReorderFaq() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (faqIds: number[]) => reorderFaq(faqIds),
    onSuccess: () => {
      // Invalidate all FAQ queries
      queryClient.invalidateQueries({ queryKey: faqKeys.all });
    },
  });
}

