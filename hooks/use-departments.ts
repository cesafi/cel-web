import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartmentById,
  deleteDepartmentById
} from '@/actions/departments';
import { DepartmentInsert, DepartmentUpdate } from '@/lib/types/departments';
import { toast } from 'sonner';

export const departmentKeys = {
  all: ['departments'] as const,
  details: (id: number) => [...departmentKeys.all, id] as const
};

export function useAllDepartments() {
  return useQuery({
    queryKey: departmentKeys.all,
    queryFn: getAllDepartments,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch departments.');
      return data.data;
    }
  });
}

export function useDepartmentById(id: number) {
  return useQuery({
    queryKey: departmentKeys.details(id),
    queryFn: () => getDepartmentById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) throw new Error(data.error || 'Department not found.');
      return data.data;
    }
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DepartmentInsert) => createDepartment(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: departmentKeys.all });
        toast.success('Department created successfully');
      } else {
        toast.error(result.error || 'Failed to create department');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DepartmentUpdate) => updateDepartmentById(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: departmentKeys.all });
        toast.success('Department updated successfully');
      } else {
        toast.error(result.error || 'Failed to update department');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDepartmentById(id),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: departmentKeys.all });
        toast.success('Department deleted successfully');
      } else {
        toast.error(result.error || 'Failed to delete department');
      }
    },
    onError: () => toast.error('An unexpected error occurred')
  });
}
