import { useQuery } from '@tanstack/react-query';
import { getMatchById } from '@/actions/matches';
import { getTeamsByStage } from '@/actions/schools-teams';
import { SchoolsTeamWithSchoolDetails } from '@/lib/types/schools-teams';
import { ServiceResponse } from '@/lib/types/base';

export const stageTeamKeys = {
  byMatch: (matchId: number) => ['stage-teams', 'match', matchId] as const,
  byStage: (stageId: number) => ['stage-teams', 'stage', stageId] as const,
};

// Hook for fetching teams by stage ID (used in add match modal)
export function useStageTeams(stageId: number) {
  return useQuery({
    queryKey: stageTeamKeys.byStage(stageId),
    queryFn: async (): Promise<SchoolsTeamWithSchoolDetails[]> => {
      const teamsResult: ServiceResponse<SchoolsTeamWithSchoolDetails[]> = await getTeamsByStage(stageId);
      if (!teamsResult.success) {
        throw new Error(teamsResult.error || 'Failed to fetch teams for stage');
      }
      return teamsResult.data || [];
    },
    enabled: stageId > 0, // Only run when we have a valid stage ID
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for fetching teams by match ID (used when we have an existing match)
export function useMatchStageTeams(matchId: number) {
  return useQuery({
    queryKey: stageTeamKeys.byMatch(matchId),
    queryFn: async (): Promise<SchoolsTeamWithSchoolDetails[]> => {
      // First get the match to find its stage
      const matchResult = await getMatchById(matchId);
      if (!matchResult.success) {
        throw new Error(matchResult.error || 'Failed to fetch match');
      }

      // Then get teams for that stage
      const teamsResult: ServiceResponse<SchoolsTeamWithSchoolDetails[]> = await getTeamsByStage(matchResult.data.stage_id);
      if (!teamsResult.success) {
        throw new Error(teamsResult.error || 'Failed to fetch teams for stage');
      }

      return teamsResult.data || [];
    },
    enabled: !!matchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}