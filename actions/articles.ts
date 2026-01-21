'use server';

import { ArticlePaginationOptions, Article } from '@/lib/types/articles';
import { ArticleService } from '@/services/articles';
import { createArticleSchema, updateArticleSchema } from '@/lib/validations/articles';
import { ServiceResponse } from '@/lib/types/base';
import { revalidatePath } from 'next/cache';
import { RevalidationHelper } from '@/lib/utils/revalidation';

export async function getPaginatedArticles(options: ArticlePaginationOptions) {
  return await ArticleService.getPaginated(options);
}

export async function getAllArticles(): Promise<ServiceResponse<Article[]>> {
  return await ArticleService.getAll();
}

export async function getRecentPublishedArticles(limit: number = 6): Promise<ServiceResponse<Article[]>> {
  return await ArticleService.getRecentPublished(limit);
}

export async function getArticleById(id: string): Promise<ServiceResponse<Article>> {
  return await ArticleService.getById(id);
}

export async function getArticleBySlug(slug: string): Promise<ServiceResponse<Article>> {
  return await ArticleService.getBySlug(slug);
}

export async function createArticle(data: unknown): Promise<ServiceResponse<Article>> {
  // Validate the input data
  const validationResult = createArticleSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await ArticleService.insert(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateArticles();
    revalidatePath('/articles');
  }

  return result;
}

export async function updateArticleById(data: unknown): Promise<ServiceResponse<Article>> {
  // Validate the input data
  const validationResult = updateArticleSchema.safeParse(data);
  
  if (!validationResult.success) {
    return {
      success: false,
      error: 'Validation failed',
      validationErrors: validationResult.error.flatten().fieldErrors as Record<string, string[]>
    };
  }

  const result = await ArticleService.updateById(validationResult.data);

  if (result.success) {
    RevalidationHelper.revalidateArticles();
    revalidatePath('/articles');
    if (validationResult.data.id) {
      revalidatePath(`/articles/${validationResult.data.id}`);
    }
  }

  return result;
}

export async function deleteArticleById(id: string) {
  const result = await ArticleService.deleteById(id);

  if (result.success) {
    RevalidationHelper.revalidateArticles();
    revalidatePath('/articles');
  }

  return result;
}