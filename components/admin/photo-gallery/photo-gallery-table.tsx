'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table/data-table';
import { useTable } from '@/hooks/use-table';
import { usePaginatedPhotoGallery, useDeletePhotoGallery, useUpdatePhotoGallery } from '@/hooks/use-photo-gallery';
import { PhotoGallery, PhotoGalleryUpdate } from '@/lib/types/photo-gallery';
import { TableColumn, TableAction } from '@/lib/types/table';
import { getPhotoGalleryColumns, getPhotoGalleryActions } from './photo-gallery-table-columns';
import { PhotoGalleryFormDialog } from './photo-gallery-form-dialog';
import { PhotoGalleryViewDialog } from './photo-gallery-view-dialog';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Image as ImageIcon } from 'lucide-react';

interface PhotoGalleryTableProps {
  initialData?: {
    data: PhotoGallery[];
    totalCount: number;
    pageCount: number;
  };
}

export function PhotoGalleryTable({ initialData }: PhotoGalleryTableProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoGallery | null>(null);

  const tableState = useTable<PhotoGallery>();
  const { data: photoGalleryData, isLoading } = usePaginatedPhotoGallery({
    page: tableState.tableState.page,
    pageSize: tableState.tableState.pageSize,
    sortBy: tableState.tableState.sortBy,
    sortOrder: tableState.tableState.sortOrder,
    searchQuery: tableState.tableState.filters.search,
    filters: tableState.tableState.filters as Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  const deleteMutation = useDeletePhotoGallery();
  const updateMutation = useUpdatePhotoGallery();

  const currentData = (photoGalleryData?.success && 'data' in photoGalleryData ? photoGalleryData.data?.data : []) || initialData?.data || [];
  const totalCount = (photoGalleryData?.success && 'data' in photoGalleryData ? photoGalleryData.data?.totalCount : 0) || initialData?.totalCount || 0;
  const pageCount = (photoGalleryData?.success && 'data' in photoGalleryData ? photoGalleryData.data?.pageCount : 0) || initialData?.pageCount || 0;

  const columns = getPhotoGalleryColumns();
  const actions = getPhotoGalleryActions().map(action => ({
    ...action,
    onClick: (photo: PhotoGallery) => {
      setSelectedPhoto(photo);
      if (action.key === 'view') {
        setIsViewDialogOpen(true);
      } else if (action.key === 'edit') {
        setIsCreateDialogOpen(true);
      } else if (action.key === 'delete') {
        setIsDeleteDialogOpen(true);
      }
    },
  }));

  const handleDelete = async () => {
    if (selectedPhoto) {
      await deleteMutation.mutateAsync(selectedPhoto.id);
      setIsDeleteDialogOpen(false);
      setSelectedPhoto(null);
    }
  };

  const handleUpdate = async (data: PhotoGalleryUpdate) => {
    if (selectedPhoto) {
      await updateMutation.mutateAsync({ id: selectedPhoto.id, data });
      setIsCreateDialogOpen(false);
      setSelectedPhoto(null);
    }
  };

  const handleCreate = () => {
    setSelectedPhoto(null);
    setIsCreateDialogOpen(true);
  };

  return (
    <>
      <DataTable<PhotoGallery>
        data={currentData}
        totalCount={totalCount}
        columns={columns as TableColumn<PhotoGallery>[]}
        actions={actions as TableAction<PhotoGallery>[]}
        currentPage={tableState.tableState.page}
        pageCount={pageCount}
        pageSize={tableState.tableState.pageSize}
        onPageChange={tableState.setPage}
        onPageSizeChange={tableState.setPageSize}
        onSortChange={tableState.setSortBy}
        onSearchChange={tableState.setSearch}
        onFiltersChange={tableState.setFilters}
        title="Photo Gallery"
        subtitle="Manage photos for the gallery"
        emptyMessage="No photos found. Add some photos to get started."
        initialSortBy="created_at"
        initialSortOrder="desc"
        addButton={{
          label: 'Add Photo',
          onClick: handleCreate,
          icon: <ImageIcon className="w-4 h-4" />,
        }}
        loading={isLoading}
      />

      <PhotoGalleryFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        photo={selectedPhoto}
        onSubmit={selectedPhoto ? handleUpdate : undefined}
      />

      <PhotoGalleryViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        photo={selectedPhoto}
      />

      <ConfirmationModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Photo"
        message={`Are you sure you want to delete "${selectedPhoto?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
