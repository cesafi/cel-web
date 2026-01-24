'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { DataTable } from '@/components/table';
import { 
  useGameCharactersByEsportId, 
  useCreateGameCharacter, 
  useUpdateGameCharacter, 
  useDeleteGameCharacter 
} from '@/hooks/use-game-characters';
import { useAllEsports } from '@/hooks/use-esports';
import { 
  CharacterModal,
  getCharactersTableColumns,
  getCharactersTableActions
} from '@/components/admin/game-characters';
import { GameCharacter, GameCharacterInsert, GameCharacterUpdate } from '@/lib/types/game-characters';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function CharactersManagementPage() {
  const params = useParams();
  const esportId = parseInt(params.esportId as string);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingCharacter, setEditingCharacter] = useState<GameCharacter | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<GameCharacter | undefined>();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: characters = [], isLoading, error, refetch } = useGameCharactersByEsportId(esportId);
  const { data: esports = [] } = useAllEsports();
  const createMutation = useCreateGameCharacter();
  const updateMutation = useUpdateGameCharacter();
  const deleteMutation = useDeleteGameCharacter();

  // Get current esport name
  const currentEsport = useMemo(() => {
    return esports.find(e => e.id === esportId);
  }, [esports, esportId]);

  // Calculate pagination
  const totalCount = characters.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedCharacters = characters.slice(offset, offset + pageSize);

  const handleEditCharacter = (character: GameCharacter) => {
    setEditingCharacter(character);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteCharacter = (character: GameCharacter) => {
    setCharacterToDelete(character);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCharacter = async () => {
    if (!characterToDelete) return;
    deleteMutation.mutate(characterToDelete.id);
    setIsDeleteModalOpen(false);
    setCharacterToDelete(undefined);
  };

  const handleSubmit = (data: GameCharacterInsert | GameCharacterUpdate) => {
    if (modalMode === 'add') {
      createMutation.mutate({ ...data, esport_id: esportId } as GameCharacterInsert);
    } else if (editingCharacter) {
      updateMutation.mutate({ id: editingCharacter.id, ...data } as GameCharacterUpdate);
    }
    setIsModalOpen(false);
  };

  const columns = getCharactersTableColumns();
  const actions = getCharactersTableActions(handleEditCharacter, handleDeleteCharacter);

  return (
    <div className="w-full space-y-6">
      <DataTable
        data={paginatedCharacters}
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
        title="Character Management"
        subtitle={currentEsport ? `Add, edit, and manage ${currentEsport.name} characters in your database.` : 'Manage game characters.'}
        searchPlaceholder="Search characters..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Character',
          onClick: () => {
            setModalMode('add');
            setEditingCharacter(undefined);
            setIsModalOpen(true);
          }
        }}
        emptyMessage="No characters found. Add one to get started."
        refetch={refetch}
      />

      {/* Modal */}
      <CharacterModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        character={editingCharacter}
        esportId={esportId}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteCharacter}
        type="delete"
        title="Delete Character"
        message={`Are you sure you want to delete "${characterToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
