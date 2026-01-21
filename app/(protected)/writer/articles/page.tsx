'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { useArticlesTable } from '@/hooks/use-articles';
import { getArticlesTableColumns, getArticlesTableActions } from '@/components/admin/articles';
import { Article } from '@/lib/types/articles';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Badge } from '@/components/ui/badge';

export default function WriterArticlesPage() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    articles,
    currentPage,
    pageSize,
    loading,
    tableBodyLoading,
    error,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFiltersChange
  } = useArticlesTable();

  // Show all articles for writers, but with different actions based on status
  const filteredArticles = articles;

  const handleDeleteArticle = () => {
    // Writers cannot delete articles
    return;
  };

  const confirmDeleteArticle = async () => {
    // Writers cannot delete articles
    return;
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
  const actions = getArticlesTableActions(handleDeleteArticle, 'writer', handlePreviewArticle, handleViewArticle);

  return (
    <div className="space-y-6 w-full">
      {/* Writer-specific info */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Badge className="bg-teal-100 text-teal-800 border-teal-200">Writer Access</Badge>
          <p className="text-sm text-teal-800">
            You can create new articles, preview all your articles, edit drafts, and edit articles that need revision.
          </p>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={filteredArticles}
        totalCount={filteredArticles.length}
        pageCount={Math.ceil(filteredArticles.length / pageSize)}
        loading={loading}
        tableBodyLoading={tableBodyLoading}
        error={error}
        columns={columns}
        actions={actions}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortChange={onSortChange}
        onSearchChange={onSearchChange}
        onFiltersChange={onFiltersChange}
        title="My Articles"
        subtitle="View all your articles, preview published ones, edit drafts, and edit articles that need revision."
        searchPlaceholder="Search your articles..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Create Article',
          onClick: () => {
            window.location.href = '/writer/articles/new';
          }
        }}
        className=""
        emptyMessage="No articles found. Create a new article to get started!"
      />

      {/* Confirmation Modal - Writers can't delete, so this won't be used */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteArticle}
        type="delete"
        title="Delete Article"
        message="Writers cannot delete articles."
        confirmText="OK"
        cancelText="Cancel"
        destructive={false}
        isLoading={false}
      />
    </div>
  );
}