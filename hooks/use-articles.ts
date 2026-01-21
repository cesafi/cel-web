import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';
import { useEffect, useState, useCallback, useRef } from 'react';

import {
  getPaginatedArticles,
  getAllArticles,
  getArticleById,
  getArticleBySlug,
  getRecentPublishedArticles,
  createArticle,
  updateArticleById,
  deleteArticleById
} from '@/actions/articles';

import {
  ArticleInsert,
  ArticleUpdate,
  ArticlePaginationOptions,
  Article
} from '@/lib/types/articles';

import { PaginatedResponse, ServiceResponse, FilterValue, PaginationOptions } from '@/lib/types/base';
import { useTable } from './use-table';
import { TableFilters } from '@/lib/types/table';
import { toast } from 'sonner';

// Query keys for caching
export const articleKeys = {
  all: ['articles'] as const,
  paginated: (options: ArticlePaginationOptions) =>
    [...articleKeys.all, 'paginated', options] as const,
  details: (id: string) => [...articleKeys.all, id] as const
};

// Basic article operations (for non-table use cases)
export function usePaginatedArticles(
  options: ArticlePaginationOptions,
  queryOptions?: UseQueryOptions<
    ServiceResponse<PaginatedResponse<Article>>,
    Error,
    PaginatedResponse<Article>
  >
) {
  return useQuery({
    queryKey: articleKeys.paginated(options),
    queryFn: () => getPaginatedArticles(options),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch paginated articles.');
      }
      return data.data;
    },
    enabled: queryOptions?.enabled ?? true,
    ...queryOptions
  });
}

export function useAllArticles(
  queryOptions?: UseQueryOptions<ServiceResponse<Article[]>, Error, Article[]>
) {
  return useQuery({
    queryKey: articleKeys.all,
    queryFn: getAllArticles,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch all articles.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useArticleById(
  id: string,
  queryOptions?: UseQueryOptions<ServiceResponse<Article>, Error, Article>
) {
  return useQuery({
    queryKey: articleKeys.details(id),
    queryFn: () => getArticleById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : `Article with ID ${id} not found.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useArticleBySlug(
  slug: string,
  queryOptions?: UseQueryOptions<ServiceResponse<Article>, Error, Article>
) {
  return useQuery({
    queryKey: [...articleKeys.all, 'slug', slug],
    queryFn: () => getArticleBySlug(slug),
    enabled: !!slug,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : `Article with slug ${slug} not found.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useRecentPublishedArticles(
  limit: number = 6,
  queryOptions?: UseQueryOptions<ServiceResponse<Article[]>, Error, Article[]>
) {
  return useQuery({
    queryKey: [...articleKeys.all, 'recent-published', limit],
    queryFn: () => getRecentPublishedArticles(limit),
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch recent published articles.');
      }
      return data.data;
    },
    ...queryOptions
  });
}

// Mutation hooks
export function useCreateArticle(
  mutationOptions?: UseMutationOptions<ServiceResponse<Article>, Error, ArticleInsert>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createArticle,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to create article:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useUpdateArticle(
  mutationOptions?: UseMutationOptions<ServiceResponse<Article>, Error, ArticleUpdate>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateArticleById,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
        if (variables.id) {
          queryClient.invalidateQueries({ queryKey: articleKeys.details(variables.id) });
        }
      }
      (mutationOptions?.onSuccess as any)?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update article:', error);
      (mutationOptions?.onError as any)?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useDeleteArticle(
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArticleById,
    onSuccess: (result, id, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
        queryClient.invalidateQueries({ queryKey: articleKeys.details(id) });
      }
      (mutationOptions?.onSuccess as any)?.(result, id, context);
    },
    onError: (error, id, context) => {
      console.error('Failed to delete article:', error);
      (mutationOptions?.onError as any)?.(error, id, context);
    },
    ...mutationOptions
  });
}

import { useEntityTable } from './use-entity-table';

// Table-specific hook that extends the base article functionality
export function useArticlesTable() {
  const {
    data: articles,
    create: createArticleMutation,
    update: updateArticleMutation,
    delete: deleteArticleMutation,
    ...rest
  } = useEntityTable<Article, ArticleInsert, ArticleUpdate>({
    queryKey: ['articles'],
    fetchAction: getPaginatedArticles,
    createAction: createArticle,
    updateAction: (data) => updateArticleById(data),
    deleteAction: deleteArticleById,
    entityName: 'Article',
    defaultSort: { by: 'created_at', order: 'desc' }
  });

  return {
    articles,
    createArticle: createArticleMutation,
    updateArticle: updateArticleMutation,
    deleteArticle: deleteArticleMutation,
    ...rest
  };
}

// ============================================================================
// DETAILS HOOKS (for backward compatibility)
// ============================================================================

// Simple alias for useArticleById to match the naming convention used in other detail pages
export const useArticleDetails = useArticleById;

// Auto-save hook for articles
export function useAutoSave(articleId: string, content: string, delay = 30000) {
  // Always call ALL hooks in the same order - no early returns allowed
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>('');

  // Auto-save mutation - always declared
  const autoSaveMutation = useMutation({
    mutationFn: async (data: { id: string; content: string }) => {
      // Parse the content string back to JSON object for database storage
      let contentToSave;
      try {
        contentToSave = JSON.parse(data.content);
      } catch {
        // If parsing fails, use the string as is
        contentToSave = data.content;
      }
      
      return updateArticleById({
        id: data.id,
        content: contentToSave,
        status: 'draft', // Always save as draft during auto-save
        updated_at: new Date().toISOString()
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        
        // Clear browser storage after successful save
        localStorage.removeItem(`article-draft-${articleId}`);
        
        // Invalidate queries to update UI
        queryClient.invalidateQueries({ queryKey: articleKeys.details(articleId) });
        queryClient.invalidateQueries({ queryKey: articleKeys.all });
      } else {
        // Fallback to browser storage if server save fails
        localStorage.setItem(`article-draft-${articleId}`, content);
        console.warn('Auto-save failed, saved to browser storage:', result.error);
      }
    },
    onError: (error) => {
      // Fallback to browser storage on error
      localStorage.setItem(`article-draft-${articleId}`, content);
      console.error('Auto-save error, saved to browser storage:', error);
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!articleId || !content || content.length === 0 || content === lastContentRef.current) {
      return;
    }

    setIsSaving(true);
    lastContentRef.current = content;
    
    try {
      await autoSaveMutation.mutateAsync({ id: articleId, content });
    } catch {
      // Error handling is done in the mutation
    }
  }, [articleId, content, autoSaveMutation]);

  // Set up auto-save timer
  useEffect(() => {
    if (!articleId || !content || content.length === 0) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set hasUnsavedChanges if content is different from last saved
    if (content !== lastContentRef.current) {
      setHasUnsavedChanges(true);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [articleId, content, delay, performAutoSave]);

  // Recover draft on mount
  useEffect(() => {
    if (!articleId) return;
    
    const savedDraft = localStorage.getItem(`article-draft-${articleId}`);
    if (savedDraft && savedDraft !== content) {
      // Notify parent component about recovered draft
      console.log('Recovered unsaved draft for article:', articleId);
    }
  }, [articleId, content]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (!articleId) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    performAutoSave();
  }, [articleId, performAutoSave]);

  // Clear draft function
  const clearDraft = useCallback(() => {
    if (!articleId) return;
    
    localStorage.removeItem(`article-draft-${articleId}`);
    setHasUnsavedChanges(false);
  }, [articleId]);

  // Return appropriate values based on whether articleId exists
  if (!articleId) {
    return {
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: false,
      saveNow: () => {},
      clearDraft: () => {},
      autoSaveError: null
    };
  }

  return {
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    saveNow,
    clearDraft,
    autoSaveError: autoSaveMutation.error
  };
}
