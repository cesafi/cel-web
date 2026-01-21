'use client';

import { ArticleForm } from '@/components/shared/articles/article-form';
import { useCreateArticle } from '@/hooks/use-articles';
import { ArticleInsert, ArticleUpdate } from '@/lib/types/articles';
import { toast } from 'sonner';

export default function CreateArticlePage() {
  const createArticleMutation = useCreateArticle({
    onSuccess: () => {
      toast.success('Article created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create article');
    }
  });

  const handleSubmit = async (data: ArticleInsert | ArticleUpdate) => {
    createArticleMutation.mutate(data as ArticleInsert);
  };

  return (
    <div className="w-full space-y-6">
      <ArticleForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createArticleMutation.isPending}
        userRole="head-writer"
        backUrl="/head-writer/articles"
      />
    </div>
  );
}
