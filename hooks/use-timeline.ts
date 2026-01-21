import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllTimelineEntries,
  getTimelineById,
  getHighlightTimelineEntries,
  getTimelineByCategory,
  createTimelineEntry,
  updateTimelineById,
  deleteTimelineById
} from '@/actions/timeline';
import { TimelineInsert, TimelineUpdate } from '@/lib/types/timeline';
import { toast } from 'sonner';

export const timelineKeys = {
  all: ['timeline'] as const,
  highlights: ['timeline', 'highlights'] as const,
  byCategory: (category: string) => [...timelineKeys.all, 'byCategory', category] as const,
  details: (id: number) => [...timelineKeys.all, id] as const
};

export function useAllTimelineEntries() {
  return useQuery({
    queryKey: timelineKeys.all,
    queryFn: getAllTimelineEntries,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch timeline.');
      return data.data;
    }
  });
}

export function useHighlightTimelineEntries() {
  return useQuery({
    queryKey: timelineKeys.highlights,
    queryFn: getHighlightTimelineEntries,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch highlights.');
      return data.data;
    }
  });
}

export function useTimelineByCategory(category: string) {
  return useQuery({
    queryKey: timelineKeys.byCategory(category),
    queryFn: () => getTimelineByCategory(category),
    enabled: !!category,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch timeline.');
      return data.data;
    }
  });
}

export function useTimelineById(id: number) {
  return useQuery({
    queryKey: timelineKeys.details(id),
    queryFn: () => getTimelineById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Entry not found.');
      return data.data;
    }
  });
}

export function useCreateTimelineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TimelineInsert) => createTimelineEntry(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: timelineKeys.all });
        toast.success('Timeline entry created successfully');
      } else {
        toast.error(result.error || 'Failed to create entry');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdateTimelineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TimelineUpdate) => updateTimelineById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: timelineKeys.all });
        toast.success('Timeline entry updated successfully');
      } else {
        toast.error(result.error || 'Failed to update entry');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteTimelineEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTimelineById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: timelineKeys.all });
        toast.success('Timeline entry deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete entry');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}
