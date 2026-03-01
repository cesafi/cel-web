'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { 
  useAllValorantMaps, 
  useCreateValorantMap, 
  useUpdateValorantMap, 
  useDeleteValorantMap 
} from '@/hooks/use-valorant-maps';
import { 
  MapModal,
  getMapsTableColumns,
  getMapsTableActions
} from '@/components/admin/valorant-maps';
import { ValorantMap, ValorantMapInsert, ValorantMapUpdate } from '@/lib/types/valorant-maps';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

interface MapsPageProps {
  title?: string;
  subtitle?: string;
}

export function MapsPage({ 
  title = "Maps Management", 
  subtitle = "Add, edit, and manage VALORANT maps in your database." 
}: MapsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingMap, setEditingMap] = useState<ValorantMap | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<ValorantMap | undefined>();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: maps = [], isLoading: isLoadingMaps, error, refetch } = useAllValorantMaps();
  
  const createMutation = useCreateValorantMap();
  const updateMutation = useUpdateValorantMap();
  const deleteMutation = useDeleteValorantMap();

  // Aggregate loading state
  const isLoading = isLoadingMaps;

  // Calculate pagination
  const totalCount = maps.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedMaps = maps.slice(offset, offset + pageSize);

  const handleEditMap = (map: ValorantMap) => {
    setEditingMap(map);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteMap = (map: ValorantMap) => {
    setMapToDelete(map);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMap = async () => {
    if (!mapToDelete) return;
    deleteMutation.mutate(mapToDelete.id);
    setIsDeleteModalOpen(false);
    setMapToDelete(undefined);
  };

  const handleSubmit = (data: ValorantMapInsert | ValorantMapUpdate) => {
    if (modalMode === 'add') {
      createMutation.mutate(data as ValorantMapInsert);
    } else if (editingMap) {
      updateMutation.mutate({ id: editingMap.id, ...data } as ValorantMapUpdate);
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

      {/* Modal */}
      <MapModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        map={editingMap}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteMap}
        type="delete"
        title="Delete Map"
        message={`Are you sure you want to delete "${mapToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
