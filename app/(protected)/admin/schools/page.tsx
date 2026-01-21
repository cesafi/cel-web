'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { useSchoolsTable } from '@/hooks/use-schools';
import { getSchoolsTableColumns, getSchoolsTableActions } from '@/components/admin/schools';
import { School } from '@/lib/types/schools';
import { SchoolModal } from '@/components/admin/schools';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SchoolInsert, SchoolUpdate } from '@/lib/types/schools';

export default function SchoolsManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingSchool, setEditingSchool] = useState<School | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<School | undefined>();

  // Simple filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const {
    schools,
    totalCount,
    pageCount,
    currentPage,
    pageSize,
    loading,
    tableBodyLoading,
    error,
    createSchool,
    updateSchool,
    deleteSchool,
    isCreating,
    isUpdating,
    isDeleting,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFiltersChange,
    resetFilters,
    refetch
  } = useSchoolsTable();

  const handleEditSchool = (school: School) => {
    setEditingSchool(school);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteSchool = (school: School) => {
    setSchoolToDelete(school);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteSchool = async () => {
    if (!schoolToDelete) return;

    try {
      deleteSchool(schoolToDelete.id);
      setIsDeleteModalOpen(false);
      setSchoolToDelete(undefined);
    } catch {
      setIsDeleteModalOpen(false);
      setSchoolToDelete(undefined);
    }
  };

  const clearFilters = () => {
    setStatusFilter('all');
    resetFilters();
  };

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    }

    if (value === 'all') {
      resetFilters();
    } else {
      const filters = { is_active: value === 'active' };
      onFiltersChange(filters);
    }
  };

  const handleSubmit = async (data: SchoolInsert | SchoolUpdate) => {
    if (modalMode === 'add') {
      createSchool(data as SchoolInsert);
    } else {
      // The modal now includes the ID in the data, so we can use it directly
      updateSchool(data as SchoolUpdate);
    }
  };

  const handleSuccess = () => {
    // Force refetch to ensure new image URLs are loaded
    refetch();
  };

  const columns = getSchoolsTableColumns();
  const actions = getSchoolsTableActions(handleEditSchool, handleDeleteSchool);

  return (
    <div className="w-full space-y-6">
      {/* Simple Filter Bar */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Status:</Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger id="status-filter" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {statusFilter !== 'all' && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filter Badges */}
      {statusFilter !== 'all' && (
        <div className="mb-4 flex flex-wrap gap-2">
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {statusFilter}
              <button
                onClick={() => handleFilterChange('status', 'all')}
                className="hover:text-destructive ml-1"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={schools}
        totalCount={totalCount}
        loading={loading}
        tableBodyLoading={tableBodyLoading}
        error={error}
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
        title="Schools Management"
        subtitle="View and manage CESAFI affiliated schools and their respective teams."
        searchPlaceholder="Search schools by name or abbreviation..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add School',
          onClick: () => {
            setModalMode('add');
            setEditingSchool(undefined);
            setIsModalOpen(true);
          }
        }}
        className=""
        emptyMessage="No schools found"
        initialSortBy="name"
        initialSortOrder="asc"
        refetch={refetch}
      />

      {/* Modal */}
      <SchoolModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        school={editingSchool}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
        onSuccess={handleSuccess}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteSchool}
        type="delete"
        title="Delete School"
        message={`Are you sure you want to delete "${schoolToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
