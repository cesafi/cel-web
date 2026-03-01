'use client';

import { TableColumn } from '@/lib/types/table';
import { MlbbMap } from '@/lib/types/mlbb-maps';
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

export const getMapsTableColumns = (): TableColumn<MlbbMap>[] => [
  {
    key: 'image',
    header: 'Image',
    sortable: false,
    width: '120px',
    render: (map: MlbbMap) => (
      <div className="flex items-center justify-center">
        {map.splash_image_url ? (
          <Image
            src={map.splash_image_url}
            alt={map.name}
            width={80}
            height={45}
            className="h-11 w-20 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-11 w-20 items-center justify-center rounded-md bg-muted text-sm font-medium text-muted-foreground">
            No Image
          </div>
        )}
      </div>
    )
  },
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    width: '30%',
    render: (map: MlbbMap) => (
      <div className="font-medium">{map.name}</div>
    )
  },
  {
    key: 'description',
    header: 'Gimmick',
    sortable: false,
    width: '40%',
    render: (map: MlbbMap) => (
      <div className="text-sm text-muted-foreground line-clamp-2" title={map.description || ''}>
        {map.description || 'No description provided'}
      </div>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '15%',
    render: (map: MlbbMap) => (
      <Badge variant={map.is_active ? 'default' : 'secondary'} className="capitalize w-fit">
        {map.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )
  }
];

export const getMapsTableActions = (
  onEdit: (map: MlbbMap) => void,
  onDelete: (map: MlbbMap) => void
) => [
  {
    key: 'edit',
    label: 'Edit Map',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Map',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];
