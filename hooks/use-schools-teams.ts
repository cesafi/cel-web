import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTeamsByStage,
  getSchoolsTeamsBySchoolAndSeason,
  getActiveTeamsBySchool,
  getAllSchoolsTeams,
  getSchoolsTeamById,
  createSchoolsTeam,
  updateSchoolsTeamById,
  deleteSchoolsTeamById
} from '@/actions/schools-teams';
import { SchoolsTeamInsert, SchoolsTeamUpdate } from '@/lib/types/schools-teams';
import { toast } from 'sonner';

export const schoolsTeamKeys = {
  all: ['schools-teams'] as const,
  byStage: (stageId: number) => [...schoolsTeamKeys.all, 'byStage', stageId] as const,
  bySchoolAndSeason: (schoolId: string, seasonId: number) => [...schoolsTeamKeys.all, 'bySchoolAndSeason', schoolId, seasonId] as const,
  activeBySchool: (schoolId: string) => [...schoolsTeamKeys.all, 'activeBySchool', schoolId] as const,
  details: (id: string) => [...schoolsTeamKeys.all, id] as const
};

export function useTeamsByStageId(stageId: number) {
  return useQuery({
    queryKey: schoolsTeamKeys.byStage(stageId),
    queryFn: () => getTeamsByStage(stageId),
    enabled: !!stageId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch teams.');
      return data.data;
    }
  });
}

export function useSchoolsTeamsBySchoolAndSeason(schoolId: string, seasonId: number) {
  return useQuery({
    queryKey: schoolsTeamKeys.bySchoolAndSeason(schoolId, seasonId),
    queryFn: () => getSchoolsTeamsBySchoolAndSeason(schoolId, seasonId),
    enabled: !!schoolId && !!seasonId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch teams.');
      return data.data;
    }
  });
}

export function useActiveTeamsBySchool(schoolId: string) {
  return useQuery({
    queryKey: schoolsTeamKeys.activeBySchool(schoolId),
    queryFn: () => getActiveTeamsBySchool(schoolId),
    enabled: !!schoolId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch teams.');
      return data.data;
    }
  });
}

export function useAllSchoolsTeams() {
  return useQuery({
    queryKey: schoolsTeamKeys.all,
    queryFn: getAllSchoolsTeams,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch teams.');
      return data.data;
    }
  });
}

export function useSchoolsTeamById(id: string) {
  return useQuery({
    queryKey: schoolsTeamKeys.details(id),
    queryFn: () => getSchoolsTeamById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Team not found.');
      return data.data;
    }
  });
}

export function useCreateSchoolsTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SchoolsTeamInsert) => createSchoolsTeam(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: schoolsTeamKeys.all });
        toast.success('Team created successfully');
      } else {
        toast.error(result.error || 'Failed to create team');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdateSchoolsTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SchoolsTeamUpdate) => updateSchoolsTeamById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: schoolsTeamKeys.all });
        toast.success('Team updated successfully');
      } else {
        toast.error(result.error || 'Failed to update team');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteSchoolsTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSchoolsTeamById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: schoolsTeamKeys.all });
        toast.success('Team deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete team');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}
