'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { 
  useAllDepartments, 
  useCreateDepartment, 
  useUpdateDepartment, 
  useDeleteDepartment 
} from '@/hooks/use-departments';
import { 
  DepartmentModal,
  getDepartmentsTableColumns,
  getDepartmentsTableActions
} from '@/components/admin/departments';
import { Department, DepartmentInsert, DepartmentUpdate } from '@/lib/types/departments';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export default function DepartmentsManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingDepartment, setEditingDepartment] = useState<Department | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | undefined>();

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: departments = [], isLoading, error, refetch } = useAllDepartments();
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const deleteMutation = useDeleteDepartment();

  // Calculate pagination
  const totalCount = departments.length;
  const pageCount = Math.ceil(totalCount / pageSize);
  const offset = (currentPage - 1) * pageSize;
  const paginatedDepartments = departments.slice(offset, offset + pageSize);

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteDepartment = (department: Department) => {
    setDepartmentToDelete(department);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteDepartment = async () => {
    if (!departmentToDelete) return;
    deleteMutation.mutate(departmentToDelete.id);
    setIsDeleteModalOpen(false);
    setDepartmentToDelete(undefined);
  };

  const handleSubmit = (data: DepartmentInsert | DepartmentUpdate) => {
    if (modalMode === 'add') {
      createMutation.mutate(data as DepartmentInsert);
    } else if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, ...data } as DepartmentUpdate);
    }
    setIsModalOpen(false);
  };

  const columns = getDepartmentsTableColumns();
  const actions = getDepartmentsTableActions(handleEditDepartment, handleDeleteDepartment);

  return (
    <div className="w-full space-y-6">
      <DataTable
        data={paginatedDepartments}
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
        title="Departments Management"
        subtitle="Manage the departments for volunteer and staff organization."
        searchPlaceholder="Search departments..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add Department',
          onClick: () => {
            setModalMode('add');
            setEditingDepartment(undefined);
            setIsModalOpen(true);
          }
        }}
        emptyMessage="No departments found"
        refetch={refetch}
      />

      {/* Modal */}
      <DepartmentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        department={editingDepartment}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteDepartment}
        type="delete"
        title="Delete Department"
        message={`Are you sure you want to delete "${departmentToDelete?.name}"? This may affect related data like volunteers.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
