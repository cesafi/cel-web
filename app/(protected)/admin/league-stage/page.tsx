'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/table';
import { useLeagueStagesTable } from '@/hooks/use-esports-seasons-stages';
import { useAllSeasons } from '@/hooks/use-seasons';
import { useSeason } from '@/components/contexts/season-provider';
import { LeagueStageModal } from '@/components/admin/league-stages';
import { EsportsSeasonStageWithDetails } from '@/lib/types/esports-seasons-stages';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { TableColumn, TableAction } from '@/lib/types/table';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Database } from '@/database.types';

type EsportsSeasonStageInsert = Database['public']['Tables']['esports_seasons_stages']['Insert'];
type EsportsSeasonStageUpdate = Database['public']['Tables']['esports_seasons_stages']['Update'];

export default function LeagueStagesManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingStage, setEditingStage] = useState<EsportsSeasonStageWithDetails | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<EsportsSeasonStageWithDetails | undefined>();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get current season from context
  const { currentSeason } = useSeason();

  const {
    stages,
    loading,
    error,
    refetch,
    createStage,
    updateStage,
    deleteStage,
    isCreating,
    isUpdating,
    isDeleting
  } = useLeagueStagesTable();

  const { data: seasons = [] } = useAllSeasons();

  // Filter stages by selected season
  const filteredStages = useMemo(() => {
    if (!currentSeason) return stages;
    return stages.filter(stage => stage.season_id === currentSeason.id);
  }, [stages, currentSeason]);

  const handleEditStage = (stage: EsportsSeasonStageWithDetails) => {
    setEditingStage(stage);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteStage = (stage: EsportsSeasonStageWithDetails) => {
    setStageToDelete(stage);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteStage = async () => {
    if (!stageToDelete) return;
    deleteStage(stageToDelete.id);
    setIsDeleteModalOpen(false);
    setStageToDelete(undefined);
  };

  const handleSubmit = (data: EsportsSeasonStageInsert | EsportsSeasonStageUpdate) => {
    if (modalMode === 'add') {
      // Auto-assign the current season when creating
      const dataWithSeason = {
        ...data,
        season_id: currentSeason?.id || data.season_id
      };
      createStage(dataWithSeason as EsportsSeasonStageInsert);
    } else if (editingStage) {
      updateStage({ id: editingStage.id, data: data as EsportsSeasonStageUpdate });
    }
    setIsModalOpen(false);
  };

  const getSeasonName = (seasonId: number | null) => {
    if (!seasonId) return '—';
    const season = seasons.find(s => s.id === seasonId);
    return season?.name || `Season ${seasonId}`;
  };

  // Calculate pagination using filtered data
  const totalCount = filteredStages.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedStages = filteredStages.slice(offset, offset + pageSize);

  const columns: TableColumn<EsportsSeasonStageWithDetails>[] = [
    {
      key: 'competition_stage',
      header: 'Stage Name',
      sortable: true,
      render: (row) => (
        <div className="font-medium">{row.competition_stage}</div>
      )
    },
    {
      key: 'season_id',
      header: 'Season',
      sortable: true,
      render: (row) => (
        <Badge variant="secondary">{getSeasonName(row.season_id)}</Badge>
      )
    },
    {
      key: 'esport_category_id',
      header: 'Esport Category',
      sortable: false,
      render: (row) => (
        <div className="text-sm">
          {row.esports_categories ? (
            <div>
              <span className="font-medium">{row.esports_categories.esports?.name}</span>
              <span className="text-muted-foreground"> — {row.esports_categories.division} ({row.esports_categories.levels})</span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (row) => (
        <div className="text-muted-foreground text-sm">
          {format(new Date(row.created_at), 'MMM d, yyyy')}
        </div>
      )
    }
  ];

  const actions: TableAction<EsportsSeasonStageWithDetails>[] = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <Pencil className="h-4 w-4" />,
      onClick: handleEditStage,
      variant: 'ghost' as const,
      size: 'sm' as const
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteStage,
      variant: 'ghost' as const,
      size: 'sm' as const
    }
  ];

  return (
    <div className="w-full space-y-6">
      <DataTable
        data={paginatedStages}
        totalCount={totalCount}
        loading={loading}
        tableBodyLoading={false}
        error={error}
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
        title="League Stages Management"
        subtitle={currentSeason ? `Managing stages for ${currentSeason.name || `Season ${currentSeason.id}`}` : 'Manage competition stages for each esport category and season.'}
        searchPlaceholder="Search stages..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Stage',
          onClick: () => {
            setModalMode('add');
            setEditingStage(undefined);
            setIsModalOpen(true);
          }
        }}
        emptyMessage={currentSeason ? `No league stages found for ${currentSeason.name || `Season ${currentSeason.id}`}` : 'No league stages found'}
        refetch={refetch}
      />

      {/* Modal */}
      <LeagueStageModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        stage={editingStage}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
        defaultSeasonId={currentSeason?.id}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteStage}
        type="delete"
        title="Delete League Stage"
        message={`Are you sure you want to delete "${stageToDelete?.competition_stage}"? This may affect related matches.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
