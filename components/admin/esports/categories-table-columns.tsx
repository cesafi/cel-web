'use client';

import { TableColumn } from '@/lib/types/table';
import { EsportCategoryWithEsport } from '@/lib/types/esports';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';

export const getCategoriesTableColumns = (): TableColumn<EsportCategoryWithEsport>[] => [
  {
    key: 'esport',
    header: 'Esport',
    sortable: true,
    width: '30%',
    render: (category: EsportCategoryWithEsport) => (
      <div className="flex items-center space-x-2">
        <div className="font-medium">{category.esports?.name || 'Unknown'}</div>
        {category.esports?.abbreviation && (
          <Badge variant="secondary" className="font-mono text-xs">
            {category.esports.abbreviation}
          </Badge>
        )}
      </div>
    )
  },
  {
    key: 'division',
    header: 'Division',
    sortable: true,
    width: '25%',
    render: (category: EsportCategoryWithEsport) => (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200 border">
        {category.division}
      </Badge>
    )
  },
  {
    key: 'levels',
    header: 'Level',
    sortable: true,
    width: '25%',
    render: (category: EsportCategoryWithEsport) => (
      <Badge className="bg-purple-100 text-purple-800 border-purple-200 border">
        {category.levels}
      </Badge>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '20%',
    render: (category: EsportCategoryWithEsport) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(category.created_at)}
      </div>
    )
  }
];

export const getCategoriesTableActions = (
  onEdit: (category: EsportCategoryWithEsport) => void,
  onDelete: (category: EsportCategoryWithEsport) => void
) => [
  {
    key: 'edit',
    label: 'Edit Category',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Category',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];
