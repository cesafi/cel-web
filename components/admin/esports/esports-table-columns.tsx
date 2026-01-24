'use client';

import { TableColumn, TableAction } from '@/lib/types/table';
import { Esport } from '@/lib/types/esports';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export const getEsportsTableColumns = (): TableColumn<Esport>[] => [
  {
    key: 'logo_url',
    header: 'Logo',
    sortable: false,
    render: (row: Esport) => (
      <div className="flex items-center justify-center">
        {row.logo_url ? (
          <Image
            src={row.logo_url}
            alt={row.name}
            width={40}
            height={40}
            className="rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground text-xs">
            N/A
          </div>
        )}
      </div>
    )
  },
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (row: Esport) => (
      <div className="font-medium">{row.name}</div>
    )
  },
  {
    key: 'abbreviation',
    header: 'Abbreviation',
    sortable: true,
    render: (row: Esport) => (
      <div className="text-muted-foreground">
        {row.abbreviation || '—'}
      </div>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    render: (row: Esport) => (
      <div className="text-muted-foreground text-sm">
        {format(new Date(row.created_at), 'MMM d, yyyy')}
      </div>
    )
  },
  {
    key: 'updated_at',
    header: 'Updated',
    sortable: true,
    render: (row: Esport) => (
      <div className="text-muted-foreground text-sm">
        {format(new Date(row.updated_at), 'MMM d, yyyy')}
      </div>
    )
  }
];

export const getEsportsTableActions = (
  onEdit: (esport: Esport) => void,
  onDelete: (esport: Esport) => void
) => [
  {
    key: 'edit',
    label: 'Edit Esport',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Esport',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];

