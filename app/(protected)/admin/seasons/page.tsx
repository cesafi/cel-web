'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { useSeasonsTable } from '@/hooks/use-seasons';
import { getSeasonsTableColumns, getSeasonsTableActions } from '@/components/admin/seasons';
import { Season } from '@/lib/types/seasons';
import { SeasonModal } from '@/components/admin/seasons';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SeasonInsert, SeasonUpdate } from '@/lib/validations/seasons';

export default function SeasonsManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingSeason, setEditingSeason] = useState<Season | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [seasonToDelete, setSeasonToDelete] = useState<Season | undefined>();

  const {
    seasons,
    totalCount,
    pageCount,
    currentPage,
    pageSize,
    loading,
    tableBodyLoading,
    error,
    createSeason,
    updateSeason,
    deleteSeason,
    isCreating,
    isUpdating,
    isDeleting,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFiltersChange,
    refetch
  } = useSeasonsTable();

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteSeason = (season: Season) => {
    setSeasonToDelete(season);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSeason = async () => {
    if (!seasonToDelete) return;

    try {
      deleteSeason(seasonToDelete.id);
      setIsDeleteModalOpen(false);
      setSeasonToDelete(undefined);
    } catch {
      setIsDeleteModalOpen(false);
      setSeasonToDelete(undefined);
    }
  };

  const handleSubmit = async (data: SeasonInsert | SeasonUpdate) => {
    if (modalMode === 'add') {
      createSeason(data as SeasonInsert);
    } else {
      updateSeason(data as SeasonUpdate);
    }
  };

  const columns = getSeasonsTableColumns();
  const actions = getSeasonsTableActions(handleEditSeason, handleDeleteSeason);

  return (
    <div className="w-full space-y-6">
      {/* Data Table */}
      <DataTable
        data={seasons}
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
        title="Seasons Management"
        subtitle="View and manage sports seasons, their dates, and status."
        searchPlaceholder="Search by season ID..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Season',
          onClick: () => {
            setModalMode('add');
            setEditingSeason(undefined);
            setIsModalOpen(true);
          }
        }}
        className=""
        emptyMessage="No seasons found"
        initialSortBy="id"
        initialSortOrder="asc"
        refetch={refetch}
      />

      {/* Modal */}
      <SeasonModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        season={editingSeason}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteSeason}
        type="delete"
        title="Delete Season"
        message={(() => {
          if (!seasonToDelete) return '';

          const isActive = (() => {
            const now = new Date();
            const startDate = new Date(seasonToDelete.start_at);
            const endDate = new Date(seasonToDelete.end_at);
            return now >= startDate && now <= endDate;
          })();

          let baseMessage = `Are you sure you want to delete this season? This action cannot be undone.`;

          if (isActive) {
            baseMessage += `\n\n⚠️ WARNING: This season is currently ACTIVE.`;
          }

          return baseMessage;
        })()}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
