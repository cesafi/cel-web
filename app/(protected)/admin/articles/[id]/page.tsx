'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArticleForm } from '@/components/shared/articles/article-form';
import { useArticleById, useUpdateArticle } from '@/hooks/use-articles';
import { ArticleUpdate, ArticleInsert } from '@/lib/types/articles';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditArticlePage() {
  const params = useParams();
  const articleId = params.id as string;

  const { data: article, isLoading, error } = useArticleById(articleId);

  const updateArticleMutation = useUpdateArticle({
    onSuccess: () => {
      toast.success('Article updated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update article');
    }
  });

  const handleSubmit = async (data: ArticleInsert | ArticleUpdate) => {
    updateArticleMutation.mutate(data as ArticleUpdate);
  };

  if (isLoading) {
    return (
      <div className="w-full py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-20" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="py-6 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The article you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.
            </p>
            <Link
              href="/admin/articles"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 w-full">
      <ArticleForm
        mode="edit"
        article={article}
        onSubmit={handleSubmit}
        isSubmitting={updateArticleMutation.isPending}
        userRole="admin"
        backUrl="/admin/articles"
      />
    </div>
  );
}
