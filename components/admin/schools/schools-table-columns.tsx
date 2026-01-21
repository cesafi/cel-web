import { Pencil, Trash2 } from 'lucide-react';
import { TableColumn } from '@/lib/types/table';
import { School } from '@/lib/types/schools';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';
import Image from 'next/image';

export const getSchoolsTableColumns = (): TableColumn<School>[] => [
  {
    key: 'schoolInfo',
    header: 'School Information',
    sortable: false,
    width: '45%',
    render: (school: School) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted">
            {school.logo_url ? (
              <Image
                src={school.logo_url}
                alt={school.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <Image
                src="/img/cesafi-logo.webp"
                alt="CESAFI Logo"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">{school.name}</div>
          <div className="text-xs text-muted-foreground">{school.abbreviation}</div>
        </div>
      </div>
    )
  },
  {
    key: 'abbreviation',
    header: 'Abbreviation',
    sortable: true,
    width: '20%',
    render: (school: School) => (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 border font-mono">
        {school.abbreviation}
      </Badge>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '20%',
    render: (school: School) => (
      <Badge 
        className={`${school.is_active 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-muted text-muted-foreground border-muted'
        } border`}
      >
        {school.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '15%',
    render: (school: School) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(school.created_at)}
      </div>
    )
  }
];

export const getSchoolsTableActions = (
  onEdit: (school: School) => void,
  onDelete: (school: School) => void
) => [
  {
    key: 'edit',
    label: 'Edit School',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete School',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];