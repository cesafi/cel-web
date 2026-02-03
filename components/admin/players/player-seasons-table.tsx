'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, History } from 'lucide-react';
import { PlayerSeasonWithDetails, PlayerSeasonInsert, PlayerSeasonUpdate } from '@/lib/types/player-seasons';
import { PlayerSeasonModal } from './player-season-modal';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { 
  usePlayerSeasonsByPlayerId, 
  useCreatePlayerSeason, 
  useUpdatePlayerSeason, 
  useDeletePlayerSeason 
} from '@/hooks/use-player-seasons';

interface PlayerSeasonsTableProps {
  playerId: string;
  playerName: string;
}

export function PlayerSeasonsTable({ playerId, playerName }: PlayerSeasonsTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEntry, setEditingEntry] = useState<PlayerSeasonWithDetails | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<PlayerSeasonWithDetails | undefined>();

  const { data: playerSeasons = [], isLoading } = usePlayerSeasonsByPlayerId(playerId);
  const createMutation = useCreatePlayerSeason();
  const updateMutation = useUpdatePlayerSeason();
  const deleteMutation = useDeletePlayerSeason();

  const handleAdd = () => {
    setEditingEntry(undefined);
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleEdit = (entry: PlayerSeasonWithDetails) => {
    setEditingEntry(entry);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (entry: PlayerSeasonWithDetails) => {
    setEntryToDelete(entry);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!entryToDelete) return;
    deleteMutation.mutate(entryToDelete.id);
    setIsDeleteModalOpen(false);
    setEntryToDelete(undefined);
  };

  const handleSubmit = (data: PlayerSeasonInsert | PlayerSeasonUpdate) => {
    if (modalMode === 'add') {
      createMutation.mutate(data as PlayerSeasonInsert);
    } else {
      updateMutation.mutate(data as PlayerSeasonUpdate);
    }
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-muted-foreground">Loading team history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <History className="h-4 w-4" />
            Team History
          </CardTitle>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1" />
            Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          {playerSeasons.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No team history found. Add the first entry.
            </div>
          ) : (
            <div className="space-y-3">
              {playerSeasons.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">
                        {entry.schools_teams?.name || 'Unknown Team'}
                        {entry.schools_teams?.schools && (
                          <span className="text-muted-foreground ml-1">
                            ({entry.schools_teams.schools.abbreviation})
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {entry.seasons?.name || `Season ${entry.season_id}`}
                      </div>
                    </div>
                    <Badge 
                      className={`${entry.is_active 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-muted text-muted-foreground border-muted'
                      } border`}
                    >
                      {entry.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PlayerSeasonModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        playerSeason={editingEntry}
        playerId={playerId}
        playerName={playerName}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        type="delete"
        title="Delete Team History Entry"
        message={`Are you sure you want to delete this entry for ${entryToDelete?.seasons?.name || `Season ${entryToDelete?.season_id}`}?`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
