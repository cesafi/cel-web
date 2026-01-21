'use server';

import { revalidatePath } from 'next/cache';
import { TimelineService } from '@/services/timeline';
import { TimelineInsert, TimelineUpdate, TimelinePaginationOptions } from '@/lib/types/timeline';

export async function getPaginatedTimeline(options: TimelinePaginationOptions) {
  return TimelineService.getPaginated(options);
}

export async function getAllTimelineEntries() {
  return TimelineService.getAll();
}

export async function getTimelineById(id: number) {
  return TimelineService.getById(id);
}

export async function getHighlightTimelineEntries() {
  return TimelineService.getHighlights();
}

export async function getTimelineByCategory(category: string) {
  return TimelineService.getByCategory(category);
}

export async function createTimelineEntry(data: TimelineInsert) {
  const result = await TimelineService.insert(data);
  if (result.success) revalidatePath('/dashboard/timeline');
  return result;
}

export async function updateTimelineById(data: TimelineUpdate) {
  const result = await TimelineService.updateById(data);
  if (result.success) revalidatePath('/dashboard/timeline');
  return result;
}

export async function deleteTimelineById(id: number) {
  const result = await TimelineService.deleteById(id);
  if (result.success) revalidatePath('/dashboard/timeline');
  return result;
}
