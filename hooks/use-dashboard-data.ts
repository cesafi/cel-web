import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getQuickActionsData } from '@/actions/dashboard';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useQuickActionsData() {
  return useQuery({
    queryKey: ['dashboard', 'quick-actions'],
    queryFn: getQuickActionsData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
