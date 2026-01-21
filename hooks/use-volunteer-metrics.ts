/**
 * Stub hook for volunteer metrics
 * TODO: Implement actual volunteer metrics data fetching
 */

import { useQuery } from '@tanstack/react-query';

export interface VolunteerDepartment {
  departmentName: string;
  count: number;
}

export interface VolunteerMetrics {
  totalActiveVolunteers: number;
  totalDepartments: number;
  totalSeasons: number;
  volunteersByDepartment: VolunteerDepartment[];
}

export function useVolunteerMetrics() {
  const query = useQuery({
    queryKey: ['volunteer-metrics'],
    queryFn: async (): Promise<VolunteerMetrics> => {
      // Stub implementation - returns empty/default data
      return {
        totalActiveVolunteers: 0,
        totalDepartments: 0,
        totalSeasons: 0,
        volunteersByDepartment: []
      };
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Return the query result with data spread for easy access
  return {
    ...query,
    // Provide typed access to the data properties
    totalActiveVolunteers: query.data?.totalActiveVolunteers ?? 0,
    totalDepartments: query.data?.totalDepartments ?? 0,
    totalSeasons: query.data?.totalSeasons ?? 0,
    volunteersByDepartment: query.data?.volunteersByDepartment ?? []
  };
}
