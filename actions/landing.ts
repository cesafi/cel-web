'use server';

import { ArticleService } from '@/services/articles';
import { getUpcomingMatchesWithDetails } from '@/actions/matches';
import { Article } from '@/lib/types/articles';
// Removed unused MatchWithFullDetails import

export async function getLatestArticles(limit: number = 4) {
  try {
    const result = await ArticleService.getRecent(limit);
    
    if (!result.success || !result.data) {
      return { 
        success: false, 
        error: result.success === false ? result.error : 'No articles returned from service' 
      };
    }

    // Get full article details for the recent articles
    const fullArticles = await Promise.all(
      result.data.map(async (article) => {
        const fullArticle = await ArticleService.getById(article.id);
        return fullArticle.success && fullArticle.data ? fullArticle.data : null;
      })
    );

    return {
      success: true,
      data: fullArticles.filter(article => article !== null) as Article[]
    };
  } catch {
    return { 
      success: false, 
      error: 'Unknown error occurred while fetching latest articles' 
    };
  }
}

export async function getUpcomingMatches(limit: number = 4) {
  try {
    const result = await getUpcomingMatchesWithDetails(limit);
    
    if (!result.success || !result.data) {
      return { 
        success: false, 
        error: result.success === false ? result.error : 'No matches returned from service' 
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch {
    return { 
      success: false, 
      error: 'Unknown error occurred while fetching upcoming matches' 
    };
  }
}
