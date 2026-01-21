'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table/data-table';
import { useTable } from '@/hooks/use-table';
import { usePaginatedHeroSectionLive, useDeleteHeroSectionLive, useUpdateHeroSectionLive } from '@/hooks/use-hero-section';
import { HeroSectionLive, HeroSectionLiveUpdate } from '@/lib/types/hero-section';
import { TableColumn, TableAction } from '@/lib/types/table';
import { getHeroSectionColumns, getHeroSectionActions } from './hero-section-table-columns';
import { HeroSectionFormDialog } from './hero-section-form-dialog';
import { HeroSectionViewDialog } from './hero-section-view-dialog';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Video } from 'lucide-react';

interface HeroSectionTableProps {
  initialData?: {
    data: HeroSectionLive[];
    totalCount: number;
    pageCount: number;
  };
}

export function HeroSectionTable({ initialData }: HeroSectionTableProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedHero, setSelectedHero] = useState<HeroSectionLive | null>(null);

  const tableState = useTable<HeroSectionLive>();
  const { data: heroSectionData, isLoading } = usePaginatedHeroSectionLive({
    page: tableState.tableState.page,
    pageSize: tableState.tableState.pageSize,
    sortBy: tableState.tableState.sortBy,
    sortOrder: tableState.tableState.sortOrder,
    searchQuery: tableState.tableState.filters.search,
    filters: tableState.tableState.filters as Record<string, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
  });

  const deleteMutation = useDeleteHeroSectionLive();
  const updateMutation = useUpdateHeroSectionLive();

  const currentData = (heroSectionData?.success && 'data' in heroSectionData ? heroSectionData.data?.data : []) || initialData?.data || [];
  const totalCount = (heroSectionData?.success && 'data' in heroSectionData ? heroSectionData.data?.totalCount : 0) || initialData?.totalCount || 0;
  const pageCount = (heroSectionData?.success && 'data' in heroSectionData ? heroSectionData.data?.pageCount : 0) || initialData?.pageCount || 0;

  const columns = getHeroSectionColumns();
  const actions = getHeroSectionActions(
    (hero: HeroSectionLive) => {
      setSelectedHero(hero);
      setIsViewDialogOpen(true);
    },
    (hero: HeroSectionLive) => {
      setSelectedHero(hero);
      setIsCreateDialogOpen(true);
    },
    (hero: HeroSectionLive) => {
      setSelectedHero(hero);
      setIsDeleteDialogOpen(true);
    }
  );

  const handleDelete = async () => {
    if (selectedHero) {
      await deleteMutation.mutateAsync(selectedHero.id);
      setIsDeleteDialogOpen(false);
      setSelectedHero(null);
    }
  };

  const handleUpdate = async (data: HeroSectionLiveUpdate) => {
    if (selectedHero) {
      await updateMutation.mutateAsync({ id: selectedHero.id, data });
      setIsCreateDialogOpen(false);
      setSelectedHero(null);
    }
  };

  const handleCreate = () => {
    setSelectedHero(null);
    setIsCreateDialogOpen(true);
  };

  return (
    <>
      <DataTable<HeroSectionLive>
        data={currentData}
        totalCount={totalCount}
        columns={columns as TableColumn<HeroSectionLive>[]}
        actions={actions as TableAction<HeroSectionLive>[]}
        currentPage={tableState.tableState.page}
        pageCount={pageCount}
        pageSize={tableState.tableState.pageSize}
        onPageChange={tableState.setPage}
        onPageSizeChange={tableState.setPageSize}
        onSortChange={tableState.setSortBy}
        onSearchChange={tableState.setSearch}
        onFiltersChange={tableState.setFilters}
        title="Hero Section Live"
        subtitle="Manage live video content for the hero section"
        emptyMessage="No hero sections found. Add a new hero section to get started."
        initialSortBy="created_at"
        initialSortOrder="desc"
        addButton={{
          label: 'Add Hero Section',
          onClick: handleCreate,
          icon: <Video className="w-4 h-4" />,
        }}
        loading={isLoading}
      />

      <HeroSectionFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        hero={selectedHero}
        onSubmit={selectedHero ? handleUpdate : undefined}
      />

      <HeroSectionViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        hero={selectedHero}
      />

      <ConfirmationModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Hero Section"
        message={`Are you sure you want to delete this hero section? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
