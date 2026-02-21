'use client';

import { TableColumn } from '@/lib/types/table';
import { Volunteer } from '@/lib/types/volunteers';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';
import Image from 'next/image';

export const getVolunteersTableColumns = (): TableColumn<Volunteer>[] => [
  {
    key: 'volunteer',
    header: 'Volunteer',
    sortable: false,
    width: '40%',
    render: (volunteer: Volunteer) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted">
            {volunteer.image_url ? (
              <Image
                src={volunteer.image_url}
                alt={volunteer.full_name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                {volunteer.full_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">{volunteer.full_name}</div>
        </div>
      </div>
    )
  },
  {
    key: 'title',
    header: 'Title',
    sortable: true,
    width: '15%',
    render: (volunteer: Volunteer) => (
      <div className="text-sm text-muted-foreground">
        {volunteer.title || '—'}
      </div>
    )
  },
  {
    key: 'is_active',
    header: 'Status',
    sortable: true,
    width: '20%',
    render: (volunteer: Volunteer) => (
      <Badge
        className={`${volunteer.is_active
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-muted text-muted-foreground border-muted'
          } border`}
      >
        {volunteer.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '20%',
    render: (volunteer: Volunteer) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(volunteer.created_at)}
      </div>
    )
  },
  {
    key: 'updated_at',
    header: 'Updated',
    sortable: true,
    width: '20%',
    render: (volunteer: Volunteer) => (
      <div className="text-sm text-muted-foreground">
        {volunteer.updated_at ? formatTableDate(volunteer.updated_at) : '—'}
      </div>
    )
  }
];

export const getVolunteersTableActions = (
  onEdit: (volunteer: Volunteer) => void,
  onDelete: (volunteer: Volunteer) => void
) => [
    {
      key: 'edit',
      label: 'Edit Volunteer',
      icon: <Pencil className="h-4 w-4" />,
      onClick: onEdit,
      variant: 'ghost' as const,
      size: 'sm' as const
    },
    {
      key: 'delete',
      label: 'Delete Volunteer',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'ghost' as const,
      size: 'sm' as const
    }
  ];
