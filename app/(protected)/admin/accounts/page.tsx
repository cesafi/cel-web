'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { useAccountsTable } from '@/hooks/use-accounts';
import { getAccountsTableColumns, getAccountsTableActions } from '@/components/admin/accounts';
import { AccountEntity } from '@/lib/types/accounts';
import { AccountModal } from '@/components/admin/accounts';
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
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function AccountsManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingAccount, setEditingAccount] = useState<AccountEntity | undefined>();

  // Confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<AccountEntity | undefined>();

  // Simple filter states
  const [roleFilter, setRoleFilter] = useState<string>('all');
  // Remove statusFilter state

  const {
    accounts,
    totalCount,
    pageCount,
    currentPage,
    pageSize,
    loading,
    tableBodyLoading,
    error,
    deleteAccount,
    isDeleting,
    refetch,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFiltersChange,
    resetFilters
  } = useAccountsTable();

  const handleEditAccount = (account: AccountEntity) => {
    setEditingAccount(account);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteAccount = (account: AccountEntity) => {
    setAccountToDelete(account);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      // Call the delete mutation - it will handle success/error via onSuccess/onError
      deleteAccount(accountToDelete.id);

      // Close the modal immediately after starting the deletion
      setIsDeleteModalOpen(false);
      setAccountToDelete(undefined);

      // Note: The mutation will automatically show success/error toasts
      // and invalidate the queries to refresh the data
    } catch {
      // This catch block handles any synchronous errors
      toast.error('Failed to initiate account deletion');
      setIsDeleteModalOpen(false);
      setAccountToDelete(undefined);
    }
  };

  const clearFilters = () => {
    console.log('Clearing filters');
    setRoleFilter('all');
    // Use resetFilters to completely clear all filters
    resetFilters();
  };

  // Handle filter changes - this will trigger server-side filtering
  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'role') {
      setRoleFilter(value);
    }

    // For "all" roles, we need to reset filters completely since onFiltersChange merges
    if (value === 'all') {
      console.log('Resetting filters for "all" roles');
      resetFilters();
    } else {
      // Only include role filter if it's not "all"
      const filters = { role: value };
      console.log('Filter change:', { filterType, value, filters });
      onFiltersChange(filters);
    }
  };

  const columns = getAccountsTableColumns();
  const actions = getAccountsTableActions(handleEditAccount, handleDeleteAccount);

  return (
    <div className="w-full space-y-6">
      {/* Simple Filter Bar */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <Label htmlFor="role-filter">Role:</Label>
          <Select value={roleFilter} onValueChange={(value) => handleFilterChange('role', value)}>
            <SelectTrigger id="role-filter" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="head_writer">Head Writer</SelectItem>
              <SelectItem value="league_operator">League Operator</SelectItem>
              <SelectItem value="writer">Writer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {roleFilter !== 'all' && (
          <Button variant="outline" size="sm" onClick={clearFilters} className="h-9">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filter Badges */}
      {roleFilter !== 'all' && (
        <div className="mb-4 flex flex-wrap gap-2">
          {roleFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Role: {roleFilter}
              <button
                onClick={() => handleFilterChange('role', 'all')}
                className="hover:text-destructive ml-1"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      <DataTable
        // Data
        data={accounts}
        totalCount={totalCount}
        loading={loading}
        tableBodyLoading={tableBodyLoading}
        error={error}
        // Columns and Actions
        columns={columns}
        actions={actions}
        // Pagination
        currentPage={currentPage}
        pageCount={pageCount}
        pageSize={pageSize}
        // State management
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        onSortChange={onSortChange}
        onSearchChange={onSearchChange}
        onFiltersChange={onFiltersChange}
        // UI customization
        title="Accounts Management"
        subtitle="View and manage various portal accounts."
        searchPlaceholder="Search accounts by name, or email"
        showSearch={true}
        showFilters={false} // We're handling filters above
        addButton={{
          label: 'Add Account',
          onClick: () => {
            setEditingAccount(undefined);
            setModalMode('add');
            setIsModalOpen(true);
          }
        }}
        // Styling
        className=""
        emptyMessage="No accounts found"
        refetch={refetch}
      />

      {/* Account Modal */}
      <AccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAccount(undefined);
        }}
        mode={modalMode}
        account={editingAccount}
        onSuccess={refetch}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAccountToDelete(undefined);
        }}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message={`Are you sure you want to delete the account "${accountToDelete?.email}"? This action cannot be undone and will permanently remove the account from the system.`}
        type="delete"
        confirmText="Delete Account"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
