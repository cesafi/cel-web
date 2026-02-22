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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Get current season from context
  const { currentSeason } = useSeason();

  const { data: players = [], isLoading, error, refetch } = useAllPlayersWithTeams();
  const createMutation = useCreatePlayer();
  const updateMutation = useUpdatePlayer();
  const deleteMutation = useDeletePlayer();

  // Filter and sort players locally
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((player) => {
        const fullName = `${player.first_name || ''} ${player.last_name || ''}`.toLowerCase();
        const ign = (player.ign || '').toLowerCase();
        const teamName = (player.schools_teams?.name || '').toLowerCase();
        
        return fullName.includes(query) || ign.includes(query) || teamName.includes(query);
      });
    }

    if (sortConfig) {
      result.sort((a, b) => {
        if (sortConfig.key === 'player') {
            const aName = (a.ign || a.first_name || '').toLowerCase();
            const bName = (b.ign || b.first_name || '').toLowerCase();
            return sortConfig.direction === 'asc' 
                ? aName.localeCompare(bName) 
                : bName.localeCompare(aName);
        } else if (sortConfig.key === 'team') {
            const aTeam = (a.schools_teams?.name || '').toLowerCase();
            const bTeam = (b.schools_teams?.name || '').toLowerCase();
            return sortConfig.direction === 'asc' 
                ? aTeam.localeCompare(bTeam) 
                : bTeam.localeCompare(aTeam);
        } else if (sortConfig.key === 'role') {
            const aRole = (a.role || '').toLowerCase();
            const bRole = (b.role || '').toLowerCase();
            return sortConfig.direction === 'asc' 
                ? aRole.localeCompare(bRole) 
                : bRole.localeCompare(aRole);
        }
        return 0;
      });
    }

    return result;
  }, [players, searchQuery, sortConfig]);

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
    const seasonId = currentSeason?.id;
    if (modalMode === 'add') {
      createMutation.mutate({ data: data as PlayerInsert, seasonId });
    } else if (editingPlayer) {
      updateMutation.mutate({ data: { id: editingPlayer.id, ...data } as PlayerUpdate, seasonId });
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
        onSortChange={(key, direction) => setSortConfig({ key, direction })}
        onSearchChange={setSearchQuery}
        onFiltersChange={() => { }}
        title="Players Management"
        subtitle="Manage esports players across all teams."
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
        emptyMessage="No players found."
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

