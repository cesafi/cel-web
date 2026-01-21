# Admin Entity Management Pages Implementation Guide

This guide documents the pattern for implementing new entity management pages in the admin dashboard, using the **Seasons Management** as the reference implementation.

## 🏗️ **Architecture Pattern**

The admin entity management system follows a consistent pattern with these key components:

### **1. Core Components Structure**
```
src/components/admin/[entity-name]/
├── index.ts                    # Export all components
├── [entity]-table-columns.tsx  # Table column definitions
├── [entity]-modal.tsx          # Add/Edit modal
└── [entity]-table-actions.tsx  # Table action buttons (optional)
```

### **2. Required Files**
- **Table Columns**: Define how data is displayed in the table
- **Modal**: Handle create/edit operations
- **Hook**: Manage data fetching, mutations, and state (consolidated in main entity hook)
- **Actions**: Server-side CRUD operations
- **Validation**: Zod schemas for form validation (in separate file)

## 📋 **Implementation Steps**

### **Step 1: Create Table Columns Component**

**File**: `src/components/admin/[entity]/[entity]-table-columns.tsx`

**Pattern**: Use `TableColumn<T>` from `@/lib/types/table`

```typescript
import { TableColumn } from '@/lib/types/table';
import { EntityType } from '@/lib/types/[entity]';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';
import { Pencil, Trash2 } from 'lucide-react';

export const get[Entity]TableColumns = (): TableColumn<EntityType>[] => [
  {
    key: 'entityInfo',
    header: 'Entity Information',
    sortable: false,
    width: '50%',
    render: (entity: EntityType) => (
      <div className="flex items-center space-x-3">
        {/* Entity display logic */}
      </div>
    )
  },
  // ... more columns
];

export const get[Entity]TableActions = (
  onEdit: (entity: EntityType) => void,
  onDelete: (entity: EntityType) => void
) => [
  {
    key: 'edit',
    label: 'Edit Entity',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Entity',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];
```

### **Step 2: Create Modal Component**

**File**: `src/components/admin/[entity]/[entity]-modal.tsx`

**Pattern**: Use `ModalLayout` from `@/components/ui/modal-layout`

```typescript
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ModalLayout } from '@/components/ui/modal-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { EntityType, EntityInsert, EntityUpdate } from '@/lib/types/[entity]';
import { createEntitySchema, updateEntitySchema } from '@/lib/validations/[entity]';
import { ZodError } from 'zod';

interface EntityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  entity?: EntityType;
  onSubmit: (data: EntityInsert | EntityUpdate) => Promise<void>;
  isSubmitting: boolean;
}

export function EntityModal({ ... }: EntityModalProps) {
  // State management
  const [formData, setFormData] = useState<EntityInsert | EntityUpdate>({...});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasStartedCreating = useRef(false);
  const hasStartedUpdating = useRef(false);

  // Form reset on modal open/close
  useEffect(() => {
    if (open) {
      // Reset form data based on mode
      if (mode === 'edit' && entity) {
        setFormData({...}); // Populate with entity data
      } else {
        setFormData({...}); // Reset to defaults
      }
      setErrors({});
      hasStartedCreating.current = false;
      hasStartedUpdating.current = false;
    }
  }, [open, mode, entity]);

  // Handle mutation completion
  useEffect(() => {
    if (hasStartedCreating.current && !isSubmitting && mode === 'add') {
      handleClose();
    }
  }, [isSubmitting, mode]);

  useEffect(() => {
    if (hasStartedUpdating.current && !isSubmitting && mode === 'edit') {
      handleClose();
    }
  }, [isSubmitting, mode]);

  const handleClose = useCallback(() => {
    setErrors({});
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const schema = mode === 'add' ? createEntitySchema : updateEntitySchema;
      const validatedData = schema.parse(formData);

      if (mode === 'add') {
        hasStartedCreating.current = true;
      } else {
        hasStartedUpdating.current = true;
      }

      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        // Handle validation errors
        const newErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path) {
            newErrors[issue.path[0] as string] = issue.message;
          }
        });
        setErrors(newErrors);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  };

  return (
    <ModalLayout
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'add' ? 'Add New Entity' : 'Edit Entity'}
      footer={
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'add' ? 'Create Entity' : 'Update Entity'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields */}
      </form>
    </ModalLayout>
  );
}
```

### **Step 3: Create Consolidated Hook**

**File**: `src/hooks/use-[entity].ts`

**Pattern**: Consolidate both basic entity operations and table functionality in one file

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions
} from '@tanstack/react-query';

import {
  getPaginated[Entity],
  getAll[Entity],
  get[Entity]ById,
  create[Entity],
  update[Entity]ById,
  delete[Entity]ById
} from '@/actions/[entity]';

import { EntityInsert, EntityUpdate, EntityPaginationOptions, Entity } from '@/lib/types/[entity]';
import { PaginatedResponse, ServiceResponse, FilterValue, PaginationOptions } from '@/lib/types/base';
import { useTable } from './use-table';
import { TableFilters } from '@/lib/types/table';
import { toast } from 'sonner';

// Query keys for caching
export const entityKeys = {
  all: ['[entity]'] as const,
  paginated: (options: EntityPaginationOptions) =>
    [...entityKeys.all, 'paginated', options] as const,
  details: (id: string) => [...entityKeys.all, id] as const
};

// Basic entity operations (for non-table use cases)
export function usePaginated[Entity](
  options: EntityPaginationOptions,
  queryOptions?: UseQueryOptions<
    ServiceResponse<PaginatedResponse<Entity>>,
    Error,
    PaginatedResponse<Entity>
  >
) {
  return useQuery({
    queryKey: entityKeys.paginated(options),
    queryFn: () => getPaginated[Entity](options),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch paginated [entity].');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function useAll[Entity](
  queryOptions?: UseQueryOptions<ServiceResponse<Entity[]>, Error, Entity[]>
) {
  return useQuery({
    queryKey: entityKeys.all,
    queryFn: getAll[Entity],
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : 'Failed to fetch all [entity].');
      }
      return data.data;
    },
    ...queryOptions
  });
}

export function use[Entity]ById(
  id: string,
  queryOptions?: UseQueryOptions<ServiceResponse<Entity>, Error, Entity>
) {
  return useQuery({
    queryKey: entityKeys.details(id),
    queryFn: () => get[Entity]ById(id),
    enabled: !!id,
    select: (data) => {
      if (!data.success || !data.data) {
        throw new Error(data.success === false ? data.error : `[Entity] with ID ${id} not found.`);
      }
      return data.data;
    },
    ...queryOptions
  });
}

// Mutation hooks
export function useCreate[Entity](
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, EntityInsert>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: create[Entity],
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: entityKeys.all });
      }
      mutationOptions?.onSuccess?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to create [entity]:', error);
      mutationOptions?.onError?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useUpdate[Entity](
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, EntityUpdate>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: update[Entity]ById,
    onSuccess: (result, variables, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: entityKeys.all });
        if (variables.id) {
          queryClient.invalidateQueries({ queryKey: entityKeys.details(variables.id) });
        }
      }
      mutationOptions?.onSuccess?.(result, variables, context);
    },
    onError: (error, variables, context) => {
      console.error('Failed to update [entity]:', error);
      mutationOptions?.onError?.(error, variables, context);
    },
    ...mutationOptions
  });
}

export function useDelete[Entity](
  mutationOptions?: UseMutationOptions<ServiceResponse<undefined>, Error, string>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: delete[Entity]ById,
    onSuccess: (result, id, context) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: entityKeys.all });
        queryClient.invalidateQueries({ queryKey: entityKeys.details(id) });
      }
      mutationOptions?.onSuccess?.(result, id, context);
    },
    onError: (error, id, context) => {
      console.error('Failed to delete [entity]:', error);
      mutationOptions?.onError?.(error, id, context);
    },
    ...mutationOptions
  });
}

// Table-specific hook that extends the base entity functionality
export function use[Entity]Table() {
  const {
    tableState,
    setPage,
    setPageSize,
    setSortBy,
    setSearch,
    setFilters,
    resetFilters,
    paginationOptions
  } = useTable<Entity>({
    initialPage: 1,
    initialPageSize: 10,
    initialSortBy: 'created_at',
    initialSortOrder: 'desc',
    pageSizeOptions: [5, 10, 25, 50, 100]
  });

  // Fetch paginated data
  const {
    data: entityData,
    isLoading,
    error,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['[entity]', 'paginated', paginationOptions],
    queryFn: () => getPaginated[Entity](paginationOptions as PaginationOptions<Record<string, FilterValue>>),
    select: (data) => {
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch [entity]');
      }
      return data.data;
    }
  });

  // Show table body loading when fetching (for sorting, searching, filtering)
  // but not on initial load
  const tableBodyLoading = isFetching && !isLoading;

  const queryClient = useQueryClient();

  // Create entity mutation
  const createEntityMutation = useMutation({
    mutationFn: create[Entity],
    onSuccess: (result) => {
      if (result.success) {
        toast.success('[Entity] created successfully');
        queryClient.invalidateQueries({ queryKey: ['[entity]'] });
      } else {
        toast.error(result.error || 'Failed to create [entity]');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Update entity mutation
  const updateEntityMutation = useMutation({
    mutationFn: (data: EntityUpdate) => update[Entity]ById(data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('[Entity] updated successfully');
        queryClient.invalidateQueries({ queryKey: ['[entity]'] });
      } else {
        toast.error(result.error || 'Failed to update [entity]');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Delete entity mutation
  const deleteEntityMutation = useMutation({
    mutationFn: delete[Entity]ById,
    onSuccess: (result) => {
      if (result.success) {
        toast.success('[Entity] deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['[entity]'] });
      } else {
        toast.error(result.error || 'Failed to delete [entity]');
      }
    },
    onError: () => {
      toast.error('An unexpected error occurred');
    }
  });

  // Handle search with debouncing
  const handleSearch = (search: string) => {
    setSearch(search);
  };

  // Handle filters
  const handleFilters = (filters: TableFilters) => {
    setFilters(filters);
  };

  // Handle sorting
  const handleSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setSortBy(sortBy, sortOrder);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setPage(page);
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPageSize(pageSize);
  };

  return {
    // Data
    [entity]: entityData?.data || [],
    totalCount: entityData?.totalCount || 0,
    pageCount: entityData?.pageCount || 0,
    currentPage: tableState.page,
    pageSize: tableState.pageSize,
    loading: isLoading,
    tableBodyLoading,
    error: error?.message || null,

    // Mutations
    create[Entity]: createEntityMutation.mutate,
    update[Entity]: updateEntityMutation.mutate,
    delete[Entity]: deleteEntityMutation.mutate,

    // Loading states
    isCreating: createEntityMutation.isPending,
    isUpdating: updateEntityMutation.isPending,
    isDeleting: deleteEntityMutation.isPending,

    // Actions
    refetch,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onSortChange: handleSort,
    onSearchChange: handleSearch,
    onFiltersChange: handleFilters,
    resetFilters
  };
}
```

### **Step 4: Create Actions**

**File**: `src/actions/[entity].ts`

**Pattern**: Use server actions with proper error handling

```typescript
'use server';

import { PaginationOptions } from '@/lib/types/base';
import { EntityInsert, EntityUpdate } from '@/lib/types/[entity]';
import { EntityService } from '@/services/[entity]';
import { revalidatePath } from 'next/cache';
import { TableFilters } from '@/lib/types/table';

export async function getPaginated[Entity](options: PaginationOptions<TableFilters>) {
  try {
    const result = await EntityService.getPaginated(options);
    
    if (!result.success || !result.data) {
      return { success: false, error: result.success === false ? result.error : 'Failed to fetch [entity]' };
    }

    return {
      success: true,
      data: {
        data: result.data.data,
        totalCount: result.data.totalCount,
        pageCount: result.data.pageCount,
        currentPage: result.data.currentPage
      }
    };
  } catch {
    return { success: false, error: 'Failed to fetch [entity]' };
  }
}

export async function create[Entity](data: EntityInsert) {
  const result = await EntityService.insert(data);
  if (result.success) {
    revalidatePath('/admin/[entity]');
  }
  return result;
}

export async function update[Entity]ById(data: EntityUpdate) {
  const result = await EntityService.updateById(data);
  if (result.success) {
    revalidatePath('/admin/[entity]');
  }
  return result;
}

export async function delete[Entity]ById(id: string) {
  const result = await EntityService.deleteById(id);
  if (result.success) {
    revalidatePath('/admin/[entity]');
  }
  return result;
}

// ... other entity-specific actions
```

### **Step 5: Create Validation Schemas**

**File**: `src/lib/validations/[entity].ts`

**Pattern**: Use Zod for validation in a separate file

```typescript
import { z } from 'zod';

export const create[Entity]Schema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }),
  // ... other fields
});

export const update[Entity]Schema = z.object({
  id: z.string().uuid({ message: 'ID is required for updating.' }),
  name: z.string().min(1, { message: 'Name cannot be empty.' }).optional(),
  // ... other fields
});

// Legacy exports for backward compatibility
export const [Entity]InsertSchema = create[Entity]Schema;
export const [Entity]UpdateSchema = update[Entity]Schema;
```

### **Step 6: Create Main Page**

**File**: `src/app/(protected)/admin/[entity]/page.tsx`

**Pattern**: Use the consolidated hook and DataTable with proper props

```typescript
'use client';

import { useState } from 'react';
import { DataTable } from '@/components/table';
import { use[Entity]Table } from '@/hooks/use-[entity]';
import { get[Entity]TableColumns, get[Entity]TableActions } from '@/components/admin/[entity]';
import { EntityType } from '@/lib/types/[entity]';
import { EntityModal } from '@/components/admin/[entity]';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { EntityInsert, EntityUpdate } from '@/lib/types/[entity]';

export default function [Entity]ManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingEntity, setEditingEntity] = useState<EntityType | undefined>();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<EntityType | undefined>();

  const {
    [entity],
    totalCount,
    pageCount,
    currentPage,
    pageSize,
    loading,
    tableBodyLoading,
    error,
    create[Entity],
    update[Entity],
    delete[Entity],
    isCreating,
    isUpdating,
    isDeleting,
    onPageChange,
    onPageSizeChange,
    onSortChange,
    onSearchChange,
    onFiltersChange
  } = use[Entity]Table();

  const handleEditEntity = (entity: EntityType) => {
    setEditingEntity(entity);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeleteEntity = (entity: EntityType) => {
    setEntityToDelete(entity);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEntity = async () => {
    if (!entityToDelete) return;

    try {
      delete[Entity](entityToDelete.id);
      setIsDeleteModalOpen(false);
      setEntityToDelete(undefined);
    } catch {
      setIsDeleteModalOpen(false);
      setEntityToDelete(undefined);
    }
  };

  const handleSubmit = async (data: EntityInsert | EntityUpdate) => {
    if (modalMode === 'add') {
      create[Entity](data as EntityInsert);
    } else {
      update[Entity](data as EntityUpdate);
    }
  };

  const columns = get[Entity]TableColumns();
  const actions = get[Entity]TableActions(handleEditEntity, handleDeleteEntity);

  return (
    <div className="space-y-6">
      {/* Data Table - Use DataTable props for header and actions */}
      <DataTable
        data={[entity]}
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
        title="[Entity] Management"
        subtitle="View and manage [entity] entries."
        searchPlaceholder="Search [entity]..."
        showSearch={true}
        showFilters={false}
        addButton={{
          label: 'Add [Entity]',
          onClick: () => {
            setModalMode('add');
            setEditingEntity(undefined);
            setIsModalOpen(true);
          }
        }}
        className=""
        emptyMessage="No [entity] found"
      />

      {/* Modal */}
      <EntityModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={modalMode}
        entity={editingEntity}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteEntity}
        type="delete"
        title="Delete [Entity]"
        message={`Are you sure you want to delete this [entity]? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        destructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
```

## 🔧 **Key Implementation Details**

### **Hook Consolidation Pattern**
- **Single File**: Keep all entity-related hooks in `use-[entity].ts`
- **Basic Operations**: `usePaginated[Entity]`, `useAll[Entity]`, `use[Entity]ById`
- **Mutations**: `useCreate[Entity]`, `useUpdate[Entity]`, `useDelete[Entity]`
- **Table Operations**: `use[Entity]Table` for DataTable functionality

### **DataTable Usage**
- **No Manual Headers**: Use `title`, `subtitle`, and `addButton` props
- **Search Placeholder**: Provide clear guidance for search functionality
- **Empty State**: Set appropriate `emptyMessage`

### **Modal State Management**
- Use `useRef` to track mutation progress
- Use `useEffect` to detect when mutations complete
- Automatically close modal on successful operations
- Reset form state on modal open/close

### **Error Handling**
- Use Zod for validation with proper error display
- Handle both validation and general errors
- Use toast notifications for success/error feedback
- Display field-specific errors below inputs

### **Form Handling**
- Use native HTML inputs for reliability (avoid complex date pickers unless necessary)
- Implement proper form reset logic
- Handle both create and edit modes in single modal

## 📚 **Available UI Components**

Use `npx shadcn@latest add [component-name]` to add missing components:

- `textarea` - For multi-line text input
- `switch` - For boolean toggles
- `select` - For dropdown selections
- `checkbox` - For boolean inputs
- `radio-group` - For single-choice selections
- `calendar` - For date selection
- `popover` - For dropdown overlays

## 🚨 **Common Pitfalls & Solutions**

### **1. Modal Closing Issues**
- **Problem**: Modal closes when clicking on popover/calendar
- **Solution**: Use native HTML inputs or implement proper event handling with `onPointerDownOutside`

### **2. Form Submission on Date Selection**
- **Problem**: Clicking dates submits form automatically
- **Solution**: Use native `<input type="date">` or implement proper event prevention

### **3. Search Functionality for Numeric Fields**
- **Problem**: PostgreSQL `ilike` doesn't work with numeric types
- **Solution**: Implement custom search logic in service layer for exact numeric matching

### **4. Type Safety Issues**
- **Problem**: `any` types and missing properties
- **Solution**: Use proper TypeScript types, handle null checks, and validate response structures

### **5. Hook Duplication**
- **Problem**: Separate table hooks create maintenance overhead
- **Solution**: Consolidate all functionality in main entity hook file

## ✅ **Testing Checklist**

- [ ] Table displays data correctly
- [ ] Search functionality works (especially for numeric fields)
- [ ] Pagination works
- [ ] Add modal opens and submits
- [ ] Edit modal populates and updates
- [ ] Delete confirmation works
- [ ] Error states display properly
- [ ] Loading states show correctly
- [ ] Form validation works
- [ ] Success/error toasts display
- [ ] Modal closes automatically on success
- [ ] Form resets properly between operations

## 🔗 **Reference Implementation**

See `src/components/admin/seasons/` for the complete working implementation that follows this pattern, including:
- Proper DataTable usage
- Native date inputs
- Enhanced delete confirmation
- Numeric search functionality
- Consolidated hook pattern

## 📝 **Migration Notes**

If you have existing separate table hooks:
1. **Consolidate**: Move table functionality into main entity hook
2. **Update Imports**: Change from `use[Entity]Table` to `use[Entity]Table` from main hook file
3. **Delete Files**: Remove separate table hook files
4. **Test**: Ensure all functionality works after consolidation

## 🆕 **New: Role-Specific Components**

### **When to Use Role-Specific Components**

Instead of runtime role checking, create dedicated components for different user roles:

#### **1. Writer Components**
- **Use Case**: When users have restricted permissions
- **Example**: `WriterArticleForm` - status field is disabled, can only edit 'revise' status
- **File**: `src/components/admin/articles/writer-article-form.tsx`

#### **2. Head Writer Components**  
- **Use Case**: When users have full permissions but are not admins
- **Example**: `HeadWriterArticleForm` - full status control, can edit and delete
- **File**: `src/components/admin/articles/head-writer-article-form.tsx`

#### **3. Admin Components**
- **Use Case**: When users have full system access
- **Example**: Can reuse `HeadWriterArticleForm` since permissions are identical
- **File**: `src/components/admin/articles/head-writer-article-form.tsx`

### **Benefits of Role-Specific Components**

1. **No Runtime Role Checking** - Each component has permissions built-in
2. **Type Safety** - No undefined variable errors
3. **Better Performance** - No conditional logic at runtime
4. **Easier Maintenance** - Clear separation of concerns
5. **Consistent UX** - Each role gets exactly what they need

### **Implementation Pattern**

```typescript
// Instead of this (runtime role checking):
{userRole === 'writer' ? (
  <ArticleForm userRole="writer" />
) : (
  <ArticleForm userRole="admin" />
)}

// Do this (dedicated components):
{userRole === 'writer' ? (
  <WriterArticleForm />
) : (
  <HeadWriterArticleForm />
)}
```

### **Component Naming Convention**

- `Writer[Entity]Form` - For restricted permissions
- `HeadWriter[Entity]Form` - For full permissions (non-admin)
- `Admin[Entity]Form` - For admin-specific functionality (if needed)

### **When to Create New Role Components**

1. **Different Permissions**: When roles have different capabilities
2. **Different UI**: When roles need different interfaces
3. **Different Validation**: When roles have different form requirements
4. **Different Actions**: When roles can perform different operations

### **Example: Article Management**

```typescript
// Writers: Restricted access
<WriterArticleForm /> // Status disabled, edit 'revise' only

// Head Writers & Admins: Full access  
<HeadWriterArticleForm /> // Full status control, edit/delete

// Reuse for efficiency
// Admin pages use HeadWriterArticleForm since permissions are identical
```

## 🆕 **New: Role-Specific Components**

### **When to Use Role-Specific Components**

Instead of runtime role checking, create dedicated components for different user roles:

#### **1. Writer Components**
- **Use Case**: When users have restricted permissions
- **Example**: `WriterArticleForm` - status field is disabled, can only edit 'revise' status
- **File**: `src/components/admin/articles/writer-article-form.tsx`

#### **2. Head Writer Components**  
- **Use Case**: When users have full permissions but are not admins
- **Example**: `HeadWriterArticleForm` - full status control, can edit and delete
- **File**: `src/components/admin/articles/head-writer-article-form.tsx`

#### **3. Admin Components**
- **Use Case**: When users have full system access
- **Example**: Can reuse `HeadWriterArticleForm` since permissions are identical
- **File**: `src/components/admin/articles/head-writer-article-form.tsx`

### **Benefits of Role-Specific Components**

1. **No Runtime Role Checking** - Each component has permissions built-in
2. **Type Safety** - No undefined variable errors
3. **Better Performance** - No conditional logic at runtime
4. **Easier Maintenance** - Clear separation of concerns
5. **Consistent UX** - Each role gets exactly what they need

### **Implementation Pattern**

```typescript
// Instead of this (runtime role checking):
{userRole === 'writer' ? (
  <ArticleForm userRole="writer" />
) : (
  <ArticleForm userRole="admin" />
)}

// Do this (dedicated components):
{userRole === 'writer' ? (
  <WriterArticleForm />
) : (
  <HeadWriterArticleForm />
)}
```

### **Component Naming Convention**

- `Writer[Entity]Form` - For restricted permissions
- `HeadWriter[Entity]Form` - For full permissions (non-admin)
- `Admin[Entity]Form` - For admin-specific functionality (if needed)

### **When to Create New Role Components**

1. **Different Permissions**: When roles have different capabilities
2. **Different UI**: When roles need different interfaces
3. **Different Validation**: When roles have different form requirements
4. **Different Actions**: When roles can perform different operations

### **Example: Article Management**

```typescript
// Writers: Restricted access
<WriterArticleForm /> // Status disabled, edit 'revise' only

// Head Writers & Admins: Full access  
<HeadWriterArticleForm /> // Full status control, edit/delete

// Reuse for efficiency
// Admin pages use HeadWriterArticleForm since permissions are identical
```

