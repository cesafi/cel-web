'use server';

import { revalidatePath } from 'next/cache';
import { SchoolsTeamService } from '@/services/schools-teams';
import { SchoolsTeamInsert, SchoolsTeamUpdate } from '@/lib/types/schools-teams';

export async function getTeamsByStage(stageId: number) {
  return SchoolsTeamService.getByStageId(stageId);
}

export async function getSchoolsTeamsBySchoolAndSeason(schoolId: string, seasonId: number) {
  return SchoolsTeamService.getBySchoolAndSeason(schoolId, seasonId);
}

export async function getActiveTeamsBySchool(schoolId: string) {
  return SchoolsTeamService.getActiveBySchool(schoolId);
}

export async function getAllSchoolsTeams() {
  return SchoolsTeamService.getAll();
}

export async function getSchoolsTeamById(id: string) {
  return SchoolsTeamService.getById(id);
}

export async function getSchoolsTeamBySlug(teamSlug: string, schoolAbbreviation: string) {
  return SchoolsTeamService.getBySlugAndSchool(teamSlug, schoolAbbreviation);
}

export async function createSchoolsTeam(data: SchoolsTeamInsert) {
  const result = await SchoolsTeamService.insert(data);
  if (result.success) revalidatePath('/dashboard/schools-teams');
  return result;
}

export async function updateSchoolsTeamById(data: SchoolsTeamUpdate) {
  const result = await SchoolsTeamService.updateById(data);
  if (result.success) revalidatePath('/dashboard/schools-teams');
  return result;
}

export async function deleteSchoolsTeamById(id: string) {
  const result = await SchoolsTeamService.deleteById(id);
  if (result.success) revalidatePath('/dashboard/schools-teams');
  return result;
}
