'use client';

import { useState, useCallback } from 'react';
import { DataTable } from '@/components/table/data-table';
import { FaqFormDialog } from './faq-form-dialog';
import { FaqViewDialog } from './faq-view-dialog';
import { getFaqColumns, getFaqActions } from './faq-table-columns';
import { usePaginatedFaq, useDeleteFaq, useUpdateFaq } from '@/hooks/use-faq';
import { Faq, FaqPaginationOptions } from '@/lib/types/faq';
import { PaginatedResponse, FilterValue } from '@/lib/types/base';
import { TableFilters } from '@/lib/types/table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface FaqTableProps {
  initialData?: PaginatedResponse<Faq>;
}

export function FaqTable({ initialData }: FaqTableProps) {
  // State for dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<Faq | undefined>();

  // Table state
  const [paginationOptions, setPaginationOptions] = useState<FaqPaginationOptions>({
    page: 1,
    pageSize: 10,
    sortBy: 'display_order',
    sortOrder: 'asc',
    filters: {}
  });

  // Data fetching
  const { data: faqResponse, isLoading, error, refetch } = usePaginatedFaq(paginationOptions);

  // Mutations
  const deleteMutation = useDeleteFaq();
  const updateMutation = useUpdateFaq();

  // Use initial data if available, otherwise use fetched data
  const faqData = faqResponse?.success && 'data' in faqResponse ? faqResponse.data : initialData;

  // Table columns
  const columns = getFaqColumns();

  // Handle actions
  const handleView = useCallback((faq: Faq) => {
    setSelectedFaq(faq);
    setViewDialogOpen(true);
  }, []);

  const handleEdit = useCallback((faq: Faq) => {
    setSelectedFaq(faq);
    setFormDialogOpen(true);
  }, []);

  const handleDelete = useCallback((faq: Faq) => {
    setSelectedFaq(faq);
    setDeleteDialogOpen(true);
  }, []);

  const handleToggleHighlight = useCallback(
    async (faq: Faq) => {
      try {
        await updateMutation.mutateAsync({
          id: faq.id,
          data: { is_highlight: !faq.is_highlight }
        });
        toast.success(`FAQ item ${faq.is_highlight ? 'removed from' : 'added to'} landing page highlights`);
      } catch (error) {
        toast.error('Failed to toggle FAQ highlight status');
        console.error('Error toggling FAQ highlight:', error);
      }
    },
    [updateMutation]
  );

  const confirmDelete = async () => {
    if (!selectedFaq) return;

    try {
      await deleteMutation.mutateAsync(selectedFaq.id);
      toast.success('FAQ item deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedFaq(undefined);
    } catch (error) {
      toast.error('Failed to delete FAQ item');
      console.error('Error deleting FAQ:', error);
    }
  };

  // Table actions
  const actions = getFaqActions(handleView, handleEdit, handleDelete, handleToggleHighlight);

  // Handle table state changes
  const handlePageChange = (page: number) => {
    setPaginationOptions((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPaginationOptions((prev) => ({ ...prev, pageSize, page: 1 }));
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setPaginationOptions((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const handleSearchChange = (searchQuery: string) => {
    setPaginationOptions((prev) => ({
      ...prev,
      searchQuery: searchQuery || undefined,
      page: 1
    }));
  };

  const handleFiltersChange = (filters: TableFilters) => {
    // Filter out undefined values to match FaqPaginationOptions type
    const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, FilterValue | string>);

    setPaginationOptions((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...cleanFilters
      },
      page: 1
    }));
  };

  // Add button
  const addButton = {
    label: 'Add FAQ Item',
    onClick: () => {
      setSelectedFaq(undefined);
      setFormDialogOpen(true);
    },
    icon: <Plus className="h-4 w-4" />,
    variant: 'primary' as const
  };

  return (
    <>
      <DataTable
        // Data
        data={faqData?.data || []}
        totalCount={faqData?.totalCount || 0}
        loading={isLoading}
        error={error ? 'Failed to load FAQ items' : null}
        // Columns and Actions
        columns={columns}
        actions={actions}
        // Pagination
        currentPage={faqData?.currentPage || 1}
        pageCount={faqData?.pageCount || 0}
        pageSize={paginationOptions.pageSize}
        pageSizeOptions={[5, 10, 25, 50]}
        // State management
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSortChange={handleSortChange}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        // UI customization
        searchPlaceholder="Search FAQ items..."
        showSearch={true}
        showFilters={false}
        addButton={addButton}
        emptyMessage="No FAQ items found"
        // Initial sort
        initialSortBy="display_order"
        initialSortOrder="asc"
        // Refetch
        refetch={refetch}
      />

      {/* Form Dialog */}
      <FaqFormDialog
        faq={selectedFaq}
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) {
            setSelectedFaq(undefined);
          }
        }}
      />

      {/* View Dialog */}
      <FaqViewDialog
        faq={selectedFaq}
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) {
            setSelectedFaq(undefined);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedFaq(undefined);
        }}
        onConfirm={confirmDelete}
        title="Delete FAQ Item"
        message={`Are you sure you want to delete this FAQ item? This action cannot be undone.${
          selectedFaq ? `\n\nQuestion: ${selectedFaq.question}` : ''
        }`}
        type="delete"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
