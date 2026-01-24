'use client';

import { TableColumn } from '@/lib/types/table';
import { Timeline } from '@/lib/types/timeline';
import { Pencil, Trash2, Star, StarOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';

const getCategoryBadge = (category: string) => {
  const colors: Record<string, string> = {
    founding: 'bg-blue-100 text-blue-800 border-blue-200',
    milestone: 'bg-green-100 text-green-800 border-green-200',
    award: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    expansion: 'bg-purple-100 text-purple-800 border-purple-200',
    achievement: 'bg-orange-100 text-orange-800 border-orange-200'
  };
  return (
    <Badge className={`${colors[category] || ''} border capitalize`}>
      {category}
    </Badge>
  );
};

export const getTimelineTableColumns = (): TableColumn<Timeline>[] => [
  {
    key: 'year',
    header: 'Year',
    sortable: true,
    width: '10%',
    render: (entry: Timeline) => (
      <div className="font-semibold text-primary">{entry.year}</div>
    )
  },
  {
    key: 'title',
    header: 'Event',
    sortable: true,
    width: '35%',
    render: (entry: Timeline) => (
      <div>
        <div className="font-medium">{entry.title}</div>
        <div className="text-sm text-muted-foreground line-clamp-1">{entry.description}</div>
      </div>
    )
  },
  {
    key: 'category',
    header: 'Category',
    sortable: true,
    width: '15%',
    render: (entry: Timeline) => getCategoryBadge(entry.category)
  },
  {
    key: 'is_highlight',
    header: 'Highlight',
    sortable: true,
    width: '10%',
    render: (entry: Timeline) => (
      <div className="flex items-center">
        {entry.is_highlight ? (
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        ) : (
          <StarOff className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '15%',
    render: (entry: Timeline) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(entry.created_at)}
      </div>
    )
  }
];

export const getTimelineTableActions = (
  onEdit: (entry: Timeline) => void,
  onDelete: (entry: Timeline) => void
) => [
  {
    key: 'edit',
    label: 'Edit Entry',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Entry',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];
