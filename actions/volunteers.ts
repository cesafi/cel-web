'use server';

import { revalidatePath } from 'next/cache';
import { VolunteerService } from '@/services/volunteers';
import { VolunteerInsert, VolunteerUpdate } from '@/lib/types/volunteers';

export async function getAllVolunteers() {
  return VolunteerService.getAll();
}

export async function getAllVolunteersWithDetails() {
  return VolunteerService.getAllWithDetails();
}

export async function getVolunteersBySeasonId(seasonId: number) {
  return VolunteerService.getBySeasonId(seasonId);
}

export async function getVolunteersByDepartmentId(departmentId: number) {
  return VolunteerService.getByDepartmentId(departmentId);
}

export async function getVolunteerById(id: string) {
  return VolunteerService.getById(id);
}

export async function createVolunteer(data: VolunteerInsert) {
  const result = await VolunteerService.insert(data);
  if (result.success) revalidatePath('/dashboard/volunteers');
  return result;
}

export async function updateVolunteerById(data: VolunteerUpdate) {
  const result = await VolunteerService.updateById(data);
  if (result.success) revalidatePath('/dashboard/volunteers');
  return result;
}

export async function deleteVolunteerById(id: string) {
  const result = await VolunteerService.deleteById(id);
  if (result.success) revalidatePath('/dashboard/volunteers');
  return result;
}
