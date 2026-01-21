'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { MatchGameModal, MatchGameScoresModal, getMatchGamesTableColumns, getMatchGamesTableActions } from '@/components/shared/matches';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { GameWithDetails, GameInsert, GameUpdate } from '@/lib/types/games';
import { GameScoreInsert, GameScoreUpdate } from '@/lib/types/game-scores';
import { useGamesTable } from '@/hooks/use-games';
import { useGameScoresByGameId, useCreateGameScore, useUpdateGameScore } from '@/hooks/use-game-scores';
import { useMatchParticipantsDetails } from '@/hooks/use-match-participants';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Target, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { gameKeys } from '@/hooks/use-games';

interface MatchGamesTableProps {
  matchId: number;
  isLoading?: boolean;
}

export function MatchGamesTable({ matchId, isLoading: externalLoading }: MatchGamesTableProps) {
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [gameModalMode, setGameModalMode] = useState<'add' | 'edit'>('add');
  const [editingGame, setEditingGame] = useState<GameWithDetails | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<GameWithDetails | undefined>();
  const [isScoresModalOpen, setIsScoresModalOpen] = useState(false);
  const [scoresGame, setScoresGame] = useState<GameWithDetails | undefined>();

  const queryClient = useQueryClient();

  // Refetch function for the DataTable
  const refetch = () => {
    if (matchId) {
      queryClient.invalidateQueries({ queryKey: gameKeys.byMatch(matchId) });
    }
  };

  // Fetch games for this match
  const {
    games,
    totalCount,
    pageCount,
    currentPage,
    pageSize,
    loading: gamesLoading,
    tableBodyLoading,
    error: gamesError,
    createGame,
    updateGame,
    deleteGame,
    isCreating,
    isUpdating,
    isDeleting,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFiltersChange
  } = useGamesTable(matchId, {
    onGameCreated: () => {
      setIsGameModalOpen(false);
      setEditingGame(undefined);
    },
    onGameUpdated: () => {
      setIsGameModalOpen(false);
      setEditingGame(undefined);
    },
    onGameDeleted: () => {
      setIsDeleteModalOpen(false);
      setGameToDelete(undefined);
    }
  });

  // Fetch match participants for scores modal
  const { data: participants = [] } = useMatchParticipantsDetails(matchId);

  // Fetch game scores for the selected game
  const { data: gameScores = [] } = useGameScoresByGameId(scoresGame?.id || 0);

  // Game score mutations
  const createGameScoreMutation = useCreateGameScore();
  const updateGameScoreMutation = useUpdateGameScore();

  const handleEditGame = (game: GameWithDetails) => {
    setEditingGame(game);
    setGameModalMode('edit');
    setIsGameModalOpen(true);
  };

  const handleDeleteGame = (game: GameWithDetails) => {
    setGameToDelete(game);
    setIsDeleteModalOpen(true);
  };

  const handleManageScores = (game: GameWithDetails) => {
    setScoresGame(game);
    setIsScoresModalOpen(true);
  };

  const handleUpdateGame = async (gameUpdate: GameUpdate) => {
    try {
      await updateGame(gameUpdate);
      toast.success('Game updated successfully');
    } catch (error) {
      toast.error('Failed to update game');
      throw error;
    }
  };

  const confirmDeleteGame = async () => {
    if (!gameToDelete) return;
    deleteGame(gameToDelete.id);
  };

  const handleGameSubmit = async (data: GameInsert | GameUpdate) => {
    if (gameModalMode === 'add') {
      createGame(data as GameInsert);
    } else {
      updateGame(data as GameUpdate);
    }
  };

  const handleSaveScores = async (scores: (GameScoreInsert | GameScoreUpdate)[]) => {
    try {
      // Process each score sequentially to avoid race conditions
      // Note: mutateAsync throws on failure, so we only need try/catch
      const results = [];
      for (const score of scores) {
        if ('id' in score && score.id) {
          // Update existing score
          const result = await updateGameScoreMutation.mutateAsync(score);
          results.push(result);
        } else {
          // Create new score
          const result = await createGameScoreMutation.mutateAsync(score as GameScoreInsert);
          results.push(result);
        }
      }
      
      toast.success('Game scores saved successfully');
      setIsScoresModalOpen(false);
      setScoresGame(undefined);
      
      // Refetch the games data to show updated scores
      refetch();
    } catch (error) {
      console.error('Failed to save game scores:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save game scores');
      throw error;
    }
  };

  // Use the match games table columns and actions
  const columns = getMatchGamesTableColumns();
  const actions = getMatchGamesTableActions(handleEditGame, handleDeleteGame, handleManageScores);

  const loading = externalLoading || gamesLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Games</h3>
            <p className="text-sm text-muted-foreground">Loading games for this match...</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64 border rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading games...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="h-6 w-6 text-primary" />
              Games
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Managing games for this match • {games.length} game{games.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Button
            onClick={() => {
              setGameModalMode('add');
              setEditingGame(undefined);
              setIsGameModalOpen(true);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Game
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable
          data={games}
          totalCount={totalCount}
          loading={false}
          tableBodyLoading={tableBodyLoading}
          error={gamesError}
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
          title=""
          subtitle=""
          searchPlaceholder="Search games..."
          showSearch={true}
          showFilters={false}
          addButton={undefined}
          className=""
          emptyMessage="No games found for this match"
          refetch={refetch}
        />
      </CardContent>

      {/* Game Modal */}
      <MatchGameModal
        open={isGameModalOpen}
        onOpenChange={setIsGameModalOpen}
        mode={gameModalMode}
        game={editingGame}
        matchId={matchId}
        onSubmit={handleGameSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Game Scores Modal */}
      {scoresGame && (
        <MatchGameScoresModal
          open={isScoresModalOpen}
          onOpenChange={setIsScoresModalOpen}
          game={scoresGame}
          participants={participants}
          gameScores={gameScores}
          onSaveScores={handleSaveScores}
          onUpdateGame={handleUpdateGame}
          isSubmitting={createGameScoreMutation.isPending || updateGameScoreMutation.isPending}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteGame}
        type="delete"
        title="Delete Game & All Scores"
        message={
          <div className="space-y-3">
            <p>Are you sure you want to delete <strong>Game {gameToDelete?.game_number}</strong>?</p>
            <div className="text-sm bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-md">
              <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">⚠️ Cascade Deletion Active</p>
              <p className="text-amber-700 dark:text-amber-300 mb-2">This will automatically delete:</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                <li><strong>All game scores</strong> for this game</li>
                <li><strong>The game itself</strong></li>
              </ul>
            </div>
            <div className="text-sm bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 rounded-md">
              <p className="font-medium text-red-800 dark:text-red-200">🚨 This action cannot be undone!</p>
              <p className="text-red-700 dark:text-red-300 mt-1">All game data will be permanently removed.</p>
            </div>
          </div>
        }
        confirmText="Delete Game & Scores"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeleting}
      />
    </Card>
  );
}