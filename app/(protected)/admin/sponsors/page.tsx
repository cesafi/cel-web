'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { useSponsorsTable } from '@/hooks/use-sponsors';
import { getSponsorsTableColumns, getSponsorsTableActions } from '@/components/admin/sponsors';
import { Sponsor } from '@/lib/types/sponsors';
import { SponsorModal } from '@/components/admin/sponsors';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { SponsorInsert, SponsorUpdate } from '@/lib/types/sponsors';

export default function SponsorsManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sponsorToDelete, setSponsorToDelete] = useState<Sponsor | undefined>();

  const {
    sponsors,
    totalCount,
    pageCount,
    currentPage,
    pageSize,
    loading,
    tableBodyLoading,
    error,
    createSponsor,
    updateSponsor,
    deleteSponsor,
    isCreating,
    isUpdating,
    isDeleting,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFiltersChange
  } = useSponsorsTable();

  const handleEditSponsor = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteSponsor = (sponsor: Sponsor) => {
    setSponsorToDelete(sponsor);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSponsor = async () => {
    if (!sponsorToDelete) return;

    try {
      deleteSponsor(sponsorToDelete.id);
      setIsDeleteModalOpen(false);
      setSponsorToDelete(undefined);
    } catch {
      setIsDeleteModalOpen(false);
      setSponsorToDelete(undefined);
    }
  };

  const handleSubmit = async (data: SponsorInsert | SponsorUpdate) => {
    if (modalMode === 'add') {
      createSponsor(data as SponsorInsert);
    } else {
      updateSponsor(data as SponsorUpdate);
    }
  };

  const columns = getSponsorsTableColumns();
  const actions = getSponsorsTableActions(handleEditSponsor, handleDeleteSponsor);

  return (
    <div className="w-full space-y-6">
      {/* Data Table - Use DataTable props for header and actions */}
      <DataTable
        data={sponsors}
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
        title="Sponsors Management"
        subtitle="View and manage sponsor entries."
        searchPlaceholder="Search sponsors..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Sponsor',
          onClick: () => {
            setModalMode('add');
            setEditingSponsor(undefined);
            setIsModalOpen(true);
          }
        }}
        className=""
        emptyMessage="No sponsors found"
      />

      {/* Modal */}
      <SponsorModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        sponsor={editingSponsor}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteSponsor}
        type="delete"
        title="Delete Sponsor"
        message={`Are you sure you want to delete "${sponsorToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
