import {
  PaginatedResponse,
  ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { Article, ArticlePaginationOptions, ArticleInsert, ArticleUpdate } from '@/lib/types/articles';
import CloudinaryService, { extractCloudinaryPublicId } from './cloudinary';

const TABLE_NAME = 'articles';

export class ArticleService extends BaseService {
  static async getPaginated(
    options: ArticlePaginationOptions,
    selectQuery: string = '*'
  ): Promise<ServiceResponse<PaginatedResponse<Article>>> {
    try {
      const searchableFields = ['title', 'content', 'status'];
      const optionsWithSearchableFields = {
        ...options,
        searchableFields
      };

      const result = await this.getPaginatedData<Article, 'articles'>(
        'articles',
        optionsWithSearchableFields,
        selectQuery
      );

      return result;
    } catch (err) {
      return this.formatError(err, `Failed to retrieve paginated articles.`);
    }
  }

  static async getAll(): Promise<ServiceResponse<Article[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.from(TABLE_NAME).select();

      if (error) {
        throw error;
      }

      // Explicitly type the data as Article[]
      const articles: Article[] = (data || []) as Article[];
      return { success: true, data: articles };
    } catch (err) {
      return this.formatError(err, `Failed to fetch all ${TABLE_NAME} entity.`);
    }
  }

  static async getCount(): Promise<ServiceResponse<number>> {
    try {
      const supabase = await this.getClient();
      const { count, error } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return { success: true, data: count || 0 };
    } catch (err) {
      return this.formatError(err, `Failed to get ${TABLE_NAME} count.`);
    }
  }

  static async getRecent(
    limit: number = 5
  ): Promise<ServiceResponse<Pick<Article, 'id' | 'title' | 'created_at' | 'status'>[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, title, created_at, status, authored_by')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch recent ${TABLE_NAME}.`);
    }
  }

  static async getRecentPublished(
    limit: number = 6
  ): Promise<ServiceResponse<Article[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      // Explicitly type the data as Article[]
      const articles: Article[] = (data || []) as Article[];
      return { success: true, data: articles };
    } catch (err) {
      return this.formatError(err, `Failed to fetch recent published ${TABLE_NAME}.`);
    }
  }

  static async getById(id: string): Promise<ServiceResponse<Article>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase.from(TABLE_NAME).select().eq('id', id).single();

      if (error) {
        throw error;
      }

      // Explicitly type the data as Article
      const article: Article = data as Article;
      return { success: true, data: article };
    } catch (err) {
      return this.formatError(err, `Failed to fetch ${TABLE_NAME} entity.`);
    }
  }

  static async getBySlug(slug: string): Promise<ServiceResponse<Article>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        throw error;
      }

      // Explicitly type the data as Article
      const article: Article = data as Article;
      return { success: true, data: article };
    } catch (err) {
      return this.formatError(err, `Failed to fetch ${TABLE_NAME} entity by slug.`);
    }
  }

  static async insert(
    data: ArticleInsert
  ): Promise<ServiceResponse<Article>> {
    try {
      const supabase = await this.getClient();

      const insertData = { ...data };

      // Handle publishing workflow logic
      // Note: published_at is now manually set by head writers/admins
      // Only clear published_at if status is not published/approved
      if (insertData.status && !['published', 'approved'].includes(insertData.status)) {
        insertData.published_at = null;
      }

      const { data: insertedData, error } = await supabase
        .from(TABLE_NAME)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data: insertedData };
    } catch (err) {
      return this.formatError(err, `Failed to insert new ${TABLE_NAME} entity.`);
    }
  }

  static async updateById(
    data: ArticleUpdate
  ): Promise<ServiceResponse<Article>> {
    try {
      if (!data.id) {
        return { success: false, error: 'Entity ID is required to update.' };
      }

      const supabase = await this.getClient();

      // Handle publishing workflow logic
      const updateData = { ...data };

      // Note: published_at is now manually set by head writers/admins
      // Only clear published_at if status is not published/approved
      if (updateData.status && !['published', 'approved'].includes(updateData.status)) {
        updateData.published_at = null;
      }

      const { error } = await supabase.from(TABLE_NAME).update(updateData).eq('id', data.id);

      if (error) {
        throw error;
      }

      // Fetch the updated article
      const { data: updatedArticle, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', data.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      return { success: true, data: updatedArticle };
    } catch (err) {
      return this.formatError(err, `Failed to update ${TABLE_NAME} entity.`);
    }
  }

  static async deleteById(id: string): Promise<ServiceResponse<undefined>> {
    try {
      if (!id) {
        return { success: false, error: 'Entity ID is required to delete.' };
      }

      const supabase = await this.getClient();

      // Fetch cover image URL before deleting
      const { data: article, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('cover_image_url')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from Cloudinary if image exists
      if (article?.cover_image_url) {
        try {
          const publicId = extractCloudinaryPublicId(article.cover_image_url);
          if (publicId) {
            await CloudinaryService.deleteImage(publicId, { resourceType: 'image' });
          }
        } catch (cloudinaryError) {
          console.warn('Failed to delete article cover image from Cloudinary:', cloudinaryError);
        }
      }

      const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

      if (error) {
        throw error;
      }

      return { success: true, data: undefined };
    } catch (err) {
      return this.formatError(err, `Failed to delete ${TABLE_NAME} entity.`);
    }
  }

  static async getScheduledForPublishing(): Promise<ServiceResponse<Article[]>> {
    try {
      const supabase = await this.getClient();
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select()
        .eq('status', 'review')
        .not('published_at', 'is', null)
        .lte('published_at', now);

      if (error) {
        throw error;
      }

      return { success: true, data: data || [] };
    } catch (err) {
      return this.formatError(err, `Failed to fetch articles scheduled for publishing.`);
    }
  }

  static async getStatsByAuthor(userId: string): Promise<ServiceResponse<{
    total: number;
    draft: number;
    review: number;
    published: number;
    archived: number;
    featured: number;
  }>> {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('status')
        .eq('authored_by', userId);

      if (error) throw error;

      const articles = data || [];
      const stats = {
        total: articles.length,
        draft: 0,
        review: 0,
        published: 0,
        archived: 0,
        featured: 0
      };

      articles.forEach(article => {
        const status = article.status as keyof typeof stats;
        if (Object.prototype.hasOwnProperty.call(stats, status)) {
          stats[status]++;
        }
      });

      return { success: true, data: stats };
    } catch (err) {
      return this.formatError(err, `Failed to get article stats for author.`);
    }
  }

  static async getRecentByAuthor(
    userId: string,
    limit: number = 5
  ): Promise<ServiceResponse<Pick<Article, 'id' | 'title' | 'created_at' | 'status'>[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('id, title, created_at, status')
        .eq('authored_by', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      return this.formatError(err, `Failed to fetch recent articles for author.`);
    }
  }

  static async getHeadWriterStats(): Promise<ServiceResponse<{
    totalArticles: number;
    activeWriters: number;
    pendingReviews: number;
    publishedThisWeek: number;
    averageReviewTime: number;
    teamPerformance: number;
  }>> {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('status, authored_by, updated_at, created_at');

      if (error) throw error;

      const articles = data || [];
      const totalArticles = articles.length;
      const pendingReviews = articles.filter(a => a.status === 'review').length;
      const published = articles.filter(a => a.status === 'published').length;

      // Published this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const publishedThisWeek = articles.filter(a =>
        a.status === 'published' && new Date(a.updated_at) > oneWeekAgo
      ).length;

      // Active writers (unique authors)
      const uniqueAuthors = new Set(articles.map(a => a.authored_by).filter(Boolean)).size;

      // Team performance (published vs total)
      const teamPerformance = totalArticles > 0 ? Math.round((published / totalArticles) * 100) : 0;

      return {
        success: true,
        data: {
          totalArticles,
          activeWriters: uniqueAuthors,
          pendingReviews,
          publishedThisWeek,
          averageReviewTime: 2.5, // Placeholder as in original
          teamPerformance
        }
      };
    } catch (err) {
      return this.formatError(err, `Failed to fetch head writer stats.`);
    }
  }

  static async getWriterPerformance(): Promise<ServiceResponse<Array<{
    name: string;
    articles: number;
    published: number;
    pending: number;
  }>>> {
    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('authored_by, status');

      if (error) throw error;

      const authorStats = new Map<string, {
        id: string;
        articles: number;
        published: number;
        pending: number;
      }>();

      data.forEach(article => {
        const authorId = article.authored_by;

        if (!authorStats.has(authorId)) {
          authorStats.set(authorId, {
            id: authorId,
            articles: 0,
            published: 0,
            pending: 0
          });
        }

        const stats = authorStats.get(authorId)!;
        stats.articles++;

        if (article.status === 'published') {
          stats.published++;
        } else if (article.status === 'review') {
          stats.pending++;
        }
      });

      // Sort by articles count desc and take top 5
      const topWriters = Array.from(authorStats.values())
        .sort((a, b) => b.articles - a.articles)
        .slice(0, 5);

      // Fetch user details for the top 5 writers
      // We need the admin client to fetch user details from auth.users
      const adminSupabase = await this.getAdminClient();

      const enrichedPerformance = await Promise.all(
        topWriters.map(async (writer) => {
          let name = 'Unknown Author';
          try {
            const { data: userData } = await adminSupabase.auth.admin.getUserById(writer.id);
            if (userData?.user) {
              name = userData.user.user_metadata?.full_name ||
                userData.user.user_metadata?.display_name ||
                userData.user.email?.split('@')[0] ||
                'Unknown Author';
            }
          } catch (e) {
            console.error(`Failed to fetch user ${writer.id}`, e);
          }

          return {
            name,
            articles: writer.articles,
            published: writer.published,
            pending: writer.pending
          };
        })
      );

      return { success: true, data: enrichedPerformance };

    } catch (err) {
      return this.formatError(err, `Failed to fetch writer performance.`);
    }
  }
}
