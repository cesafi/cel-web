'use client';

import { TableColumn } from '@/lib/types/table';
import { Department } from '@/lib/types/departments';
import { Pencil, Trash2 } from 'lucide-react';
import { formatTableDate } from '@/lib/utils/date';

export const getDepartmentsTableColumns = (): TableColumn<Department>[] => [
  {
    key: 'name',
    header: 'Department Name',
    sortable: true,
    width: '50%',
    render: (department: Department) => (
      <div className="font-medium">{department.name}</div>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '25%',
    render: (department: Department) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(department.created_at)}
      </div>
    )
  },
  {
    key: 'updated_at',
    header: 'Updated',
    sortable: true,
    width: '25%',
    render: (department: Department) => (
      <div className="text-sm text-muted-foreground">
        {department.updated_at ? formatTableDate(department.updated_at) : '—'}
      </div>
    )
  }
];

export const getDepartmentsTableActions = (
  onEdit: (department: Department) => void,
  onDelete: (department: Department) => void
) => [
  {
    key: 'edit',
    label: 'Edit Department',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Department',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];
