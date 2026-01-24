'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/table';
import { 
  useAllSchoolsTeams, 
  useCreateSchoolsTeam, 
  useUpdateSchoolsTeam, 
  useDeleteSchoolsTeam 
} from '@/hooks/use-schools-teams';
import { useSeason } from '@/components/contexts/season-provider';
import { 
  getSchoolsTeamsTableColumns, 
  getSchoolsTeamsTableActions,
  SchoolTeamModal 
} from '@/components/admin/schools-teams';
import { SchoolsTeamWithSportDetails, SchoolsTeamInsert, SchoolsTeamUpdate } from '@/lib/types/schools-teams';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function SchoolTeamsManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTeam, setEditingTeam] = useState<SchoolsTeamWithSportDetails | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<SchoolsTeamWithSportDetails | undefined>();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get current season from context
  const { currentSeason } = useSeason();

  const { data: teams = [], isLoading, error, refetch } = useAllSchoolsTeams();
  const createMutation = useCreateSchoolsTeam();
  const updateMutation = useUpdateSchoolsTeam();
  const deleteMutation = useDeleteSchoolsTeam();

  // Filter teams by selected season
  const filteredTeams = useMemo(() => {
    if (!currentSeason) return teams;
    return teams.filter(team => team.season_id === currentSeason.id);
  }, [teams, currentSeason]);

  // Calculate pagination using filtered data
  const totalCount = filteredTeams.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedTeams = filteredTeams.slice(offset, offset + pageSize);

  const handleEditTeam = (team: SchoolsTeamWithSportDetails) => {
    setEditingTeam(team);
    setSelectedSchoolId(team.school_id);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteTeam = (team: SchoolsTeamWithSportDetails) => {
    setTeamToDelete(team);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    deleteMutation.mutate(teamToDelete.id);
    setIsDeleteModalOpen(false);
    setTeamToDelete(undefined);
  };

  const handleSubmit = async (data: SchoolsTeamInsert | SchoolsTeamUpdate) => {
    if (modalMode === 'add') {
      // Auto-assign the current season when creating
      const dataWithSeason = {
        ...data,
        season_id: currentSeason?.id || (data as SchoolsTeamInsert).season_id
      };
      createMutation.mutate(dataWithSeason as SchoolsTeamInsert);
    } else if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, ...data } as SchoolsTeamUpdate);
    }
    setIsModalOpen(false);
  };

  const columns = getSchoolsTeamsTableColumns();
  const actions = getSchoolsTeamsTableActions(handleEditTeam, handleDeleteTeam);

  return (
    <div className="w-full space-y-6">
      {/* Data Table */}
      <DataTable
        data={paginatedTeams}
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
        title="School Teams Management"
        subtitle={currentSeason ? `Managing teams for Season ${currentSeason.id}` : 'View and manage school teams for all esports categories and seasons.'}
        searchPlaceholder="Search teams..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Team',
          onClick: () => {
            setModalMode('add');
            setEditingTeam(undefined);
            setSelectedSchoolId(null);
            setIsModalOpen(true);
          }
        }}
        emptyMessage={currentSeason ? `No teams found for Season ${currentSeason.id}` : 'No teams found'}
        refetch={refetch}
      />

      {/* Modal */}
      <SchoolTeamModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        team={editingTeam}
        selectedSchoolId={selectedSchoolId}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteTeam}
        type="delete"
        title="Delete Team"
        message={`Are you sure you want to delete "${teamToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
