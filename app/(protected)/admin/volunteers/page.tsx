'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/table';
import { 
  useAllVolunteersWithDetails, 
  useCreateVolunteer, 
  useUpdateVolunteer, 
  useDeleteVolunteer 
} from '@/hooks/use-volunteers';
import { useSeason } from '@/components/contexts/season-provider';
import { 
  VolunteerModal,
  getVolunteersTableColumns,
  getVolunteersTableActions
} from '@/components/admin/volunteers';
import { Volunteer, VolunteerInsert, VolunteerUpdate } from '@/lib/types/volunteers';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function VolunteersManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [volunteerToDelete, setVolunteerToDelete] = useState<Volunteer | undefined>();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get current season from context
  const { currentSeason } = useSeason();

  const { data: volunteers = [], isLoading, error, refetch } = useAllVolunteersWithDetails();
  const createMutation = useCreateVolunteer();
  const updateMutation = useUpdateVolunteer();
  const deleteMutation = useDeleteVolunteer();

  // Filter volunteers by selected season
  const filteredVolunteers = useMemo(() => {
    if (!currentSeason) return volunteers;
    return volunteers.filter(volunteer => volunteer.season_id === currentSeason.id);
  }, [volunteers, currentSeason]);

  // Calculate pagination using filtered data
  const totalCount = filteredVolunteers.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedVolunteers = filteredVolunteers.slice(offset, offset + pageSize);

  const handleEditVolunteer = (volunteer: Volunteer) => {
    setEditingVolunteer(volunteer);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteVolunteer = (volunteer: Volunteer) => {
    setVolunteerToDelete(volunteer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteVolunteer = async () => {
    if (!volunteerToDelete) return;
    deleteMutation.mutate(volunteerToDelete.id);
    setIsDeleteModalOpen(false);
    setVolunteerToDelete(undefined);
  };

  const handleSubmit = (data: VolunteerInsert | VolunteerUpdate) => {
    if (modalMode === 'add') {
      // Auto-assign the current season when creating
      const dataWithSeason = {
        ...data,
        season_id: currentSeason?.id || (data as VolunteerInsert).season_id
      };
      createMutation.mutate(dataWithSeason as VolunteerInsert);
    } else if (editingVolunteer) {
      updateMutation.mutate({ id: editingVolunteer.id, ...data } as VolunteerUpdate);
    }
    setIsModalOpen(false);
  };

  const columns = getVolunteersTableColumns();
  const actions = getVolunteersTableActions(handleEditVolunteer, handleDeleteVolunteer);

  return (
    <div className="w-full space-y-6">
      <DataTable
        data={paginatedVolunteers}
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
        title="Volunteers Management"
        subtitle={currentSeason ? `Managing volunteers for Season ${currentSeason.id}` : 'Manage volunteers across all departments and seasons.'}
        searchPlaceholder="Search volunteers..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Volunteer',
          onClick: () => {
            setModalMode('add');
            setEditingVolunteer(undefined);
            setIsModalOpen(true);
          }
        }}
        emptyMessage={currentSeason ? `No volunteers found for Season ${currentSeason.id}` : 'No volunteers found'}
        refetch={refetch}
      />

      {/* Modal */}
      <VolunteerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        volunteer={editingVolunteer}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteVolunteer}
        type="delete"
        title="Delete Volunteer"
        message={`Are you sure you want to delete "${volunteerToDelete?.full_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
