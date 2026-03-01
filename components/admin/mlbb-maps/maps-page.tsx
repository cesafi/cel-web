'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { 
  useAllMlbbMaps, 
  useCreateMlbbMap, 
  useUpdateMlbbMap, 
  useDeleteMlbbMap 
} from '@/hooks/use-mlbb-maps';
import { MapModal } from './map-modal';
import { getMapsTableColumns, getMapsTableActions } from './maps-table-columns';
import { MlbbMap, MlbbMapInsert, MlbbMapUpdate } from '@/lib/types/mlbb-maps';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface MapsPageProps {
  title?: string;
  subtitle?: string;
}

export function MapsPage({ 
  title = "MLBB Maps Management", 
  subtitle = "Add, edit, and manage Mobile Legends maps with distinct mechanics." 
}: MapsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingMap, setEditingMap] = useState<MlbbMap | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<MlbbMap | undefined>();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: maps = [], isLoading: isLoadingMaps, error, refetch } = useAllMlbbMaps();
  
  const createMutation = useCreateMlbbMap();
  const updateMutation = useUpdateMlbbMap();
  const deleteMutation = useDeleteMlbbMap();

  const totalCount = maps.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedMaps = maps.slice(offset, offset + pageSize);

  const handleEditMap = (map: MlbbMap) => {
    setEditingMap(map);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteMap = (map: MlbbMap) => {
    setMapToDelete(map);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMap = async () => {
    if (!mapToDelete) return;
    deleteMutation.mutate(mapToDelete.id);
    setIsDeleteModalOpen(false);
    setMapToDelete(undefined);
  };

  const handleSubmit = (data: MlbbMapInsert | MlbbMapUpdate) => {
    if (modalMode === 'add') {
      createMutation.mutate(data as MlbbMapInsert);
    } else if (editingMap) {
      updateMutation.mutate({ ...data, id: editingMap.id } as MlbbMapUpdate & { id: number });
    }
    setIsModalOpen(false);
  };

  const columns = getMapsTableColumns();
  const actions = getMapsTableActions(handleEditMap, handleDeleteMap);

  return (
    <div className="w-full space-y-6">
      <DataTable
        data={paginatedMaps}
        totalCount={totalCount}
        loading={isLoadingMaps}
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
        title={title}
        subtitle={subtitle}
        searchPlaceholder="Search maps..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Map',
          onClick: () => {
            setModalMode('add');
            setEditingMap(undefined);
            setIsModalOpen(true);
          }
        }}
        emptyMessage="No maps found. Add one to get started."
        refetch={refetch}
      />

      <MapModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        map={editingMap}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteMap}
        type="delete"
        title="Delete Map"
        message={`Are you sure you want to delete "${mapToDelete?.name}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
