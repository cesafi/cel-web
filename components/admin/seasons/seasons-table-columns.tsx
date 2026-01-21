import { Calendar, Hash, Pencil, Trash2 } from 'lucide-react';
import { TableColumn } from '@/lib/types/table';
import { Season } from '@/lib/types/seasons';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';

export const getSeasonsTableColumns = (): TableColumn<Season>[] => [
  {
    key: 'seasonInfo',
    header: 'Season Information',
    sortable: false,
    width: '40%',
    render: (season: Season) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Hash className="text-primary h-5 w-5" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">
            Season {season.id}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatTableDate(season.start_at)} - {formatTableDate(season.end_at)}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '20%',
    render: (season: Season) => {
      const now = new Date();
      const startDate = new Date(season.start_at);
      const endDate = new Date(season.end_at);
      
      let status = 'upcoming';
      let statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      
      if (now >= startDate && now <= endDate) {
        status = 'active';
        statusClass = 'bg-green-100 text-green-800 border-green-200';
      } else if (now > endDate) {
        status = 'completed';
        statusClass = 'bg-muted text-muted-foreground border-muted';
      }
      
      return (
        <Badge className={`${statusClass} border capitalize`}>
          {status}
        </Badge>
      );
    }
  },
  {
    key: 'duration',
    header: 'Duration',
    sortable: false,
    width: '25%',
    render: (season: Season) => {
      const days = Math.ceil((new Date(season.end_at).getTime() - new Date(season.start_at).getTime()) / (1000 * 60 * 60 * 24));
      return (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">{days} days</span>
        </div>
      );
    }
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '15%',
    render: (season: Season) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(season.created_at)}
      </div>
    )
  }
];

export const getSeasonsTableActions = (
  onEdit: (season: Season) => void,
  onDelete: (season: Season) => void
) => [
  {
    key: 'edit',
    label: 'Edit Season',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Season',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];