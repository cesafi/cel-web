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
