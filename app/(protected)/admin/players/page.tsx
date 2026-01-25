'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/table';
import { 
  useAllPlayersWithTeams, 
  useCreatePlayer, 
  useUpdatePlayer, 
  useDeletePlayer 
} from '@/hooks/use-players';
import { useSeason } from '@/components/contexts/season-provider';
import { 
  PlayerModal,
  getPlayersTableColumns,
  getPlayersTableActions,
  PlayerSeasonsTable
} from '@/components/admin/players';
import { PlayerInsert, PlayerUpdate, PlayerWithTeam } from '@/lib/types/players';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { ModalLayout } from '@/components/ui/modal-layout';

export default function PlayersManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithTeam | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerWithTeam | undefined>();
  
  // Team history modal state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyPlayer, setHistoryPlayer] = useState<PlayerWithTeam | undefined>();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Get current season from context
  const { currentSeason } = useSeason();

  const { data: players = [], isLoading, error, refetch } = useAllPlayersWithTeams();
  const createMutation = useCreatePlayer();
  const updateMutation = useUpdatePlayer();
  const deleteMutation = useDeletePlayer();

  // Filter players by selected season (via their team's season)
  // Note: If players don't have a direct season_id, we show all players
  // This can be adjusted based on your data model
  const filteredPlayers = useMemo(() => {
    // For now, show all players - adjust filtering logic based on your schema
    return players;
  }, [players]);

  // Calculate pagination using filtered data
  const totalCount = filteredPlayers.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedPlayers = filteredPlayers.slice(offset, offset + pageSize);

  const handleEditPlayer = (player: PlayerWithTeam) => {
    setEditingPlayer(player);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeletePlayer = (player: PlayerWithTeam) => {
    setPlayerToDelete(player);
    setIsDeleteModalOpen(true);
  };

  const handleViewHistory = (player: PlayerWithTeam) => {
    setHistoryPlayer(player);
    setIsHistoryModalOpen(true);
  };

  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return;
    deleteMutation.mutate(playerToDelete.id);
    setIsDeleteModalOpen(false);
    setPlayerToDelete(undefined);
  };

  const handleSubmit = (data: PlayerInsert | PlayerUpdate) => {
    if (modalMode === 'add') {
      createMutation.mutate(data as PlayerInsert);
    } else if (editingPlayer) {
      updateMutation.mutate({ id: editingPlayer.id, ...data } as PlayerUpdate);
    }
    setIsModalOpen(false);
  };

  const columns = getPlayersTableColumns();
  const actions = getPlayersTableActions(handleEditPlayer, handleDeletePlayer, handleViewHistory);

  return (
    <div className="w-full space-y-6">
      <DataTable
        data={paginatedPlayers}
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
        title="Players Management"
        subtitle={currentSeason ? `Managing players for Season ${currentSeason.id}` : 'Manage esports players across all teams.'}
        searchPlaceholder="Search players..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Player',
          onClick: () => {
            setModalMode('add');
            setEditingPlayer(undefined);
            setIsModalOpen(true);
          }
        }}
        emptyMessage={currentSeason ? `No players found for Season ${currentSeason.id}` : 'No players found'}
        refetch={refetch}
      />

      {/* Player Modal */}
      <PlayerModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        player={editingPlayer}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Team History Modal */}
      <ModalLayout
        open={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
        title={`Team History - ${historyPlayer?.ign || ''}`}
        maxWidth="max-w-2xl"
      >
        {historyPlayer && (
          <PlayerSeasonsTable
            playerId={historyPlayer.id}
            playerName={historyPlayer.ign}
          />
        )}
      </ModalLayout>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeletePlayer}
        type="delete"
        title="Delete Player"
        message={`Are you sure you want to delete "${playerToDelete?.ign}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

