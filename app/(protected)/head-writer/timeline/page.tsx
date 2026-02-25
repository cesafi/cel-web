'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { 
  useAllTimelineEntries, 
  useCreateTimelineEntry, 
  useUpdateTimelineEntry, 
  useDeleteTimelineEntry 
} from '@/hooks/use-timeline';
import { 
  TimelineModal,
  getTimelineTableColumns,
  getTimelineTableActions
} from '@/components/admin/timeline';
import { Timeline, TimelineInsert, TimelineUpdate } from '@/lib/types/timeline';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function HeadWriterTimelinePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEntry, setEditingEntry] = useState<Timeline | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<Timeline | undefined>();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: entries = [], isLoading, error, refetch } = useAllTimelineEntries();
  const createMutation = useCreateTimelineEntry();
  const updateMutation = useUpdateTimelineEntry();
  const deleteMutation = useDeleteTimelineEntry();

  // Calculate pagination
  const totalCount = entries.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedEntries = entries.slice(offset, offset + pageSize);

  const handleEditEntry = (entry: Timeline) => {
    setEditingEntry(entry);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteEntry = (entry: Timeline) => {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEntry = async () => {
    if (!entryToDelete) return;
    deleteMutation.mutate(entryToDelete.id);
    setIsDeleteModalOpen(false);
    setEntryToDelete(undefined);
  };

  const handleSubmit = (data: TimelineInsert | TimelineUpdate) => {
    if (modalMode === 'add') {
      createMutation.mutate(data as TimelineInsert);
    } else if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, ...data } as TimelineUpdate);
    }
    setIsModalOpen(false);
  };

  const columns = getTimelineTableColumns();
  const actions = getTimelineTableActions(handleEditEntry, handleDeleteEntry);

  return (
    <div className="w-full space-y-6">
      <DataTable
        data={paginatedEntries}
        totalCount={totalCount}
        loading={isLoading}
        tableBodyLoading={false}
        error={error?.message || null}
        columns={columns}
        actions={actions}
        currentPage={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        onSortChange={() => {}}
        onSearchChange={() => {}}
        onFiltersChange={() => {}}
        title="Timeline Management"
        subtitle="Manage the CESAFI timeline events and milestones."
        searchPlaceholder="Search timeline events..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Event',
          onClick: () => {
            setModalMode('add');
            setEditingEntry(undefined);
            setIsModalOpen(true);
          }
        }}
        emptyMessage="No timeline events found"
        refetch={refetch}
      />

      {/* Modal */}
      <TimelineModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        entry={editingEntry}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteEntry}
        type="delete"
        title="Delete Timeline Event"
        message={`Are you sure you want to delete "${entryToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
