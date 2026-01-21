import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';

import {
  getPaginatedSchools,
  getAllSchools,
  getActiveSchools,
  getSchoolById,
  getSchoolByAbbreviation,
  createSchool,
  updateSchoolById,
  deleteSchoolById
} from '@/actions/schools';

import { SchoolInsert, SchoolUpdate, SchoolPaginationOptions, School } from '@/lib/types/schools';

import { ServiceResponse, FilterValue, PaginationOptions } from '@/lib/types/base';
import { useTable } from './use-table';
import { TableFilters } from '@/lib/types/table';
import { toast } from 'sonner';

export const schoolKeys = {
  all: ['schools'] as const,
  paginated: (options: SchoolPaginationOptions) =>
    [...schoolKeys.all, 'paginated', options] as const,
  details: (id: string) => [...schoolKeys.all, id] as const
};

export function usePaginatedSchools(
  options: SchoolPaginationOptions,
  queryOptions?: UseQueryOptions<
    {
      success: boolean;
      error?: string;
      data?: { data: School[]; totalCount: number; pageCount: number; currentPage: number };
    },
    Error,
    { data: School[]; totalCount: number; pageCount: number; currentPage: number }
  >
) {
  return useQuery({
    queryKey: schoolKeys.paginated(options),
    queryFn: () => getPaginatedSchools(options),
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to fetch paginated schools.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useAllSchools(
  queryOptions?: UseQueryOptions<ServiceResponse<School[]>, Error, School[]>
) {
  return useQuery({
    queryKey: schoolKeys.all,
    queryFn: getAllSchools,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch all schools.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useActiveSchools(
  queryOptions?: UseQueryOptions<ServiceResponse<School[]>, Error, School[]>
) {
  return useQuery({
    queryKey: [...schoolKeys.all, 'active'],
    queryFn: getActiveSchools,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch active schools.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useSchoolById(
  id: string,
  queryOptions?: UseQueryOptions<ServiceResponse<School>, Error, School>
) {
  return useQuery({
    queryKey: schoolKeys.details(id),
    queryFn: () => getSchoolById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : `School with ID ${id} not found.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useSchoolByAbbreviation(
  abbreviation: string,
  queryOptions?: UseQueryOptions<ServiceResponse<School>, Error, School>
) {
  return useQuery({
    queryKey: [...schoolKeys.all, 'abbreviation', abbreviation],
    queryFn: () => getSchoolByAbbreviation(abbreviation),
    enabled: !!abbreviation,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : `School with abbreviation ${abbreviation} not found.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useCreateSchool(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, SchoolInsert>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSchool,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: schoolKeys.all });
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to create school:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useUpdateSchool(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, SchoolUpdate>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSchoolById,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: schoolKeys.all });
        if (variables.id) {
          queryClient.invalidateQueries({ queryKey: schoolKeys.details(variables.id) });
        }
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update school:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useDeleteSchool(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSchoolById,
    onSuccess: (result, id, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: schoolKeys.all });
        queryClient.invalidateQueries({ queryKey: schoolKeys.details(id) });
        // CRITICAL: Invalidate related entities that depend on this school
        queryClient.invalidateQueries({ queryKey: ['schools-teams'] });
        queryClient.invalidateQueries({ queryKey: ['match_participants'] });
        queryClient.invalidateQueries({ queryKey: ['matches'] });
      }
      (mutationOptions?.onSuccess as any)?.(result, id, context);
    },
    onError: (error, id, context) => {
      console.error('Failed to delete school:', error);
      (mutationOptions?.onError as any)?.(error, id, context);
    },
    ...mutationOptions
  });
}

import { useEntityTable } from './use-entity-table';

// Table-specific hook that extends the base school functionality
export function useSchoolsTable() {
  const {
    data: schools,
    create: createSchoolMutation,
    update: updateSchoolMutation,
    delete: deleteSchoolMutation,
    ...rest
  } = useEntityTable<School, SchoolInsert, SchoolUpdate>({
    queryKey: ['schools'],
    fetchAction: getPaginatedSchools,
    createAction: createSchool,
    updateAction: (data) => updateSchoolById(data),
    deleteAction: deleteSchoolById,
    entityName: 'School',
    defaultSort: { by: 'name', order: 'asc' }
  });

  return {
    schools,
    createSchool: createSchoolMutation,
    updateSchool: updateSchoolMutation,
    deleteSchool: deleteSchoolMutation,
    ...rest
  };
}
