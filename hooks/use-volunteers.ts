import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllVolunteers,
  getAllVolunteersWithDetails,
  getVolunteersBySeasonId,
  getVolunteersByDepartmentId,
  getVolunteerById,
  createVolunteer,
  updateVolunteerById,
  deleteVolunteerById
} from '@/actions/volunteers';
import { VolunteerInsert, VolunteerUpdate } from '@/lib/types/volunteers';
import { toast } from 'sonner';

export const volunteerKeys = {
  all: ['volunteers'] as const,
  withDetails: ['volunteers', 'withDetails'] as const,
  bySeason: (seasonId: number) => [...volunteerKeys.all, 'bySeason', seasonId] as const,
  byDepartment: (departmentId: number) => [...volunteerKeys.all, 'byDepartment', departmentId] as const,
  details: (id: string) => [...volunteerKeys.all, id] as const
};

export function useAllVolunteers() {
  return useQuery({
    queryKey: volunteerKeys.all,
    queryFn: getAllVolunteers,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch volunteers.');
      return data.data;
    }
  });
}

export function useAllVolunteersWithDetails() {
  return useQuery({
    queryKey: volunteerKeys.withDetails,
    queryFn: getAllVolunteersWithDetails,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch volunteers.');
      return data.data;
    }
  });
}

export function useVolunteersBySeasonId(seasonId: number) {
  return useQuery({
    queryKey: volunteerKeys.bySeason(seasonId),
    queryFn: () => getVolunteersBySeasonId(seasonId),
    enabled: !!seasonId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch volunteers.');
      return data.data;
    }
  });
}

export function useVolunteersByDepartmentId(departmentId: number) {
  return useQuery({
    queryKey: volunteerKeys.byDepartment(departmentId),
    queryFn: () => getVolunteersByDepartmentId(departmentId),
    enabled: !!departmentId,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch volunteers.');
      return data.data;
    }
  });
}

export function useVolunteerById(id: string) {
  return useQuery({
    queryKey: volunteerKeys.details(id),
    queryFn: () => getVolunteerById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Volunteer not found.');
      return data.data;
    }
  });
}

export function useCreateVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VolunteerInsert) => createVolunteer(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
        toast.success('Volunteer created successfully');
      } else {
        toast.error(result.error || 'Failed to create volunteer');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdateVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VolunteerUpdate) => updateVolunteerById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
        toast.success('Volunteer updated successfully');
      } else {
        toast.error(result.error || 'Failed to update volunteer');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVolunteerById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: volunteerKeys.all });
        toast.success('Volunteer deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete volunteer');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}
