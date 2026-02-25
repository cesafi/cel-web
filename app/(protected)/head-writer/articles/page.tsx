'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { useArticlesTable } from '@/hooks/use-articles';
import { getArticlesTableColumns, getArticlesTableActions } from '@/components/admin/articles';
import { Article } from '@/lib/types/articles';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { useRouter } from 'next/navigation';

export default function HeadWriterArticlesPage() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | undefined>();
  const router = useRouter();

  const {
    articles,
    totalCount,
    pageCount,
    currentPage,
    pageSize,
    loading,
    tableBodyLoading,
    error,
    deleteArticle,
    isDeleting,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFiltersChange
  } = useArticlesTable();

  const handleAddArticle = () => {
    router.push('/head-writer/articles/new');
  }

  const handleDeleteArticle = (article: Article) => {
    setArticleToDelete(article);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;

    try {
      deleteArticle(articleToDelete.id);
      setIsDeleteModalOpen(false);
      setArticleToDelete(undefined);
    } catch {
      setIsDeleteModalOpen(false);
      setArticleToDelete(undefined);
    }
  };

  const handlePreviewArticle = (article: Article) => {
    // Open private preview in a new tab
    window.open(`/preview/articles/${article.id}`, '_blank');
  };

  const handleViewArticle = (article: Article) => {
    // Open published article in a new tab
    window.open(`/news/${article.slug}`, '_blank');
  };

  const columns = getArticlesTableColumns();
  const actions = getArticlesTableActions(handleDeleteArticle, 'head-writer', handlePreviewArticle, handleViewArticle);

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Articles Management</h1>
        <p className="text-muted-foreground">Review and manage articles for publication.</p>
      </div>

      {/* Data Table */}
      <DataTable
        data={articles}
        totalCount={totalCount}
        loading={loading}
        tableBodyLoading={tableBodyLoading}
        error={error}
        columns={columns}
        actions={actions}
        currentPage={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortChange={onSortChange}
        onSearchChange={onSearchChange}
        onFiltersChange={onFiltersChange}
        title="Articles Management"
        subtitle="Review and manage articles for publication."
        searchPlaceholder="Search articles by title, content, or status..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Create Article',
          onClick: () => { handleAddArticle() }
        }}
        className=""
        emptyMessage="No articles found"
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteArticle}
        type="delete"
        title="Delete Article"
        message={`Are you sure you want to delete "${articleToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}