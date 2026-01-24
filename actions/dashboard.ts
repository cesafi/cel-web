'use server';

import { SchoolService } from '@/services/schools';
import { EsportsService } from '@/services/esports';
import { ArticleService } from '@/services/articles';
import { VolunteerService } from '@/services/volunteers';
import { SeasonService } from '@/services/seasons';
import { GameService } from '@/services/games';
import { MatchesService } from '@/services/matches';

export async function getDashboardStats() {
  try {
    // Get counts for all entities using efficient count methods
    const [schoolsCount, sportsCount, articlesCount, volunteersCount, seasonsCount, gamesCount] =
      await Promise.all([
        SchoolService.getCount(),
        EsportsService.getCount(),
        ArticleService.getCount(),
        VolunteerService.getCount(),
        SeasonService.getCount(),
        GameService.getCount()
      ]);

    // Get recent activity data using efficient recent methods
    const [recentArticlesResult, recentGamesResult, recentMatchesResult] = await Promise.all([
      ArticleService.getRecent(5),
      GameService.getRecent(5),
      MatchesService.getRecent(5)
    ]);

    const recentArticles =
      recentArticlesResult.success && recentArticlesResult.data ? recentArticlesResult.data : [];

    const recentGames =
      recentGamesResult.success && recentGamesResult.data ? recentGamesResult.data : [];

    const recentMatches =
      recentMatchesResult.success && recentMatchesResult.data ? recentMatchesResult.data : [];

    return {
      success: true,
      data: {
        counts: {
          schools: schoolsCount.success ? schoolsCount.data || 0 : 0,
          sports: sportsCount.success ? sportsCount.data || 0 : 0,
          articles: articlesCount.success ? articlesCount.data || 0 : 0,
          volunteers: volunteersCount.success ? volunteersCount.data || 0 : 0,
          seasons: seasonsCount.success ? seasonsCount.data || 0 : 0,
          games: gamesCount.success ? gamesCount.data || 0 : 0
        },
        recentActivity: {
          articles: recentArticles,
          games: recentGames,
          matches: recentMatches
        }
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      success: false,
      error: 'Failed to fetch dashboard statistics'
    };
  }
}

export async function getQuickActionsData() {
  try {
    // Get counts for quick actions display
    const [schoolsCount, seasonsCount, articlesCount] = await Promise.all([
      SchoolService.getCount(),
      SeasonService.getCount(),
      ArticleService.getCount()
    ]);

    return {
      success: true,
      data: {
        schools: schoolsCount.success ? schoolsCount.data || 0 : 0,
        seasons: seasonsCount.success ? seasonsCount.data || 0 : 0,
        articles: articlesCount.success ? articlesCount.data || 0 : 0
      }
    };
  } catch (error) {
    console.error('Error fetching quick actions data:', error);
    return {
      success: false,
      error: 'Failed to fetch quick actions data'
    };
  }
}
export async function getWriterDashboardStats(userId: string) {
  try {
    const [statsResult, recentResult] = await Promise.all([
      ArticleService.getStatsByAuthor(userId),
      ArticleService.getRecentByAuthor(userId, 5)
    ]);

    return {
      success: true,
      data: {
        stats: statsResult.success && statsResult.data ? statsResult.data : {
          total: 0,
          draft: 0,
          review: 0,
          published: 0,
          archived: 0,
          featured: 0
        },
        recentActivity: recentResult.success && recentResult.data ? recentResult.data : []
      }
    };
  } catch (error) {
    console.error('Error fetching writer dashboard stats:', error);
    return {
      success: false,
      error: 'Failed to fetch writer dashboard statistics'
    };
  }
}

export async function getHeadWriterDashboardStats() {
  try {
    const [statsResult, recentResult, performanceResult] = await Promise.all([
      ArticleService.getHeadWriterStats(),
      ArticleService.getRecent(5),
      ArticleService.getWriterPerformance()
    ]);

    return {
      success: true,
      data: {
        stats: statsResult.success && statsResult.data ? statsResult.data : {
          totalArticles: 0,
          activeWriters: 0,
          pendingReviews: 0,
          publishedThisWeek: 0,
          averageReviewTime: 2.5,
          teamPerformance: 0
        },
        recentActivity: recentResult.success && recentResult.data ? recentResult.data : [],
        writerPerformance: performanceResult.success && performanceResult.data ? performanceResult.data : []
      }
    };
  } catch (error) {
    console.error('Error fetching head writer dashboard stats:', error);
    return {
      success: false,
      error: 'Failed to fetch head writer dashboard statistics'
    };
  }
}

export async function getLeagueOperatorDashboardStats() {
  try {
    const [statsResult, recentResult, matchesTodayResult] = await Promise.all([
      MatchesService.getLeagueOperatorStats(),
      MatchesService.getRecent(5),
      MatchesService.getTodayMatches(3)
    ]);

    return {
      success: true,
      data: {
        stats: statsResult.success && statsResult.data ? statsResult.data : {
          totalMatches: 0,
          upcomingMatches: 0,
          completedMatches: 0,
          activeStages: 0,
          participatingTeams: 0,
          pendingActions: 0,
          matchesToday: 0,
          averageAttendance: 0
        },
        recentActivity: recentResult.success && recentResult.data ? recentResult.data : [],
        matchesToday: matchesTodayResult.success && matchesTodayResult.data ? matchesTodayResult.data : []
      }
    };
  } catch (error) {
    console.error('Error fetching league operator dashboard stats:', error);
    return {
      success: false,
      error: 'Failed to fetch league operator dashboard statistics'
    };
  }
}
