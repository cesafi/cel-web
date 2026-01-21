import {
  PaginatedResponse,
  ServiceResponse
} from '@/lib/types/base';
import { BaseService } from './base';
import { Article, ArticlePaginationOptions, ArticleInsert, ArticleUpdate } from '@/lib/types/articles';

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
        .select('id, title, created_at, status')
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
}
