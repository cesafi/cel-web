import { TableColumn } from '@/lib/types/table';
import { Sponsor } from '@/lib/types/sponsors';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';

export const getSponsorsTableColumns = (): TableColumn<Sponsor>[] => [
  {
    key: 'sponsorInfo',
    header: 'Sponsor Information',
    sortable: false,
    width: '50%',
    render: (sponsor: Sponsor) => (
      <div className="flex items-center space-x-3">
        {sponsor.logo_url && (
          <div className="relative h-12 w-12 flex-shrink-0">
            <Image
              src={sponsor.logo_url}
              alt={`${sponsor.title} logo`}
              fill
              className="rounded-md object-cover"
              sizes="48px"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {sponsor.title}
          </p>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {sponsor.tagline}
          </p>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '15%',
    render: (sponsor: Sponsor) => (
      <Badge variant={sponsor.is_active ? 'default' : 'secondary'}>
        {sponsor.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '20%',
    render: (sponsor: Sponsor) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {formatTableDate(sponsor.created_at)}
      </span>
    )
  },
  {
    key: 'updated_at',
    header: 'Updated',
    sortable: true,
    width: '15%',
    render: (sponsor: Sponsor) => (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {sponsor.updated_at ? formatTableDate(sponsor.updated_at) : 'Never'}
      </span>
    )
  }
];

export const getSponsorsTableActions = (
  onEdit: (sponsor: Sponsor) => void,
  onDelete: (sponsor: Sponsor) => void
) => [
  {
    key: 'edit',
    label: 'Edit Sponsor',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Sponsor',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];
