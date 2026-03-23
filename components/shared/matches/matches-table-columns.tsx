import { TableColumn } from '@/lib/types/table';
import { MatchWithStageDetails } from '@/lib/types/matches';
import { formatDateShort, formatSmartDate } from '@/lib/utils/date';
import { Pencil, Trash2, MapPin, Trophy, Eye } from 'lucide-react';
import { formatCategoryName } from '@/lib/utils/sports';
import { formatUtcForDisplay } from '@/lib/utils/utc-time';

export const getMatchesTableColumns = (): TableColumn<MatchWithStageDetails>[] => [
  {
    key: 'matchInfo',
    header: 'Match Information',
    sortable: false,
    width: '30%',
    render: (match: MatchWithStageDetails) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="text-primary h-5 w-5" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            {match.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {match.description}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'sportInfo',
    header: 'Sport & Category',
    sortable: false,
    width: '20%',
    render: (match: MatchWithStageDetails) => (
      <div className="space-y-1">
        <div className="text-sm font-medium">
          {match.esports_seasons_stages?.esports_categories?.esports?.name ?? 'N/A'}
        </div>
        <div className="text-xs text-muted-foreground">
          {match.esports_seasons_stages?.esports_categories ?
            formatCategoryName(
              match.esports_seasons_stages.esports_categories.division,
              match.esports_seasons_stages.esports_categories.levels
            ) : 'N/A'
          }
        </div>
      </div>
    )
  },
  {
    key: 'stageInfo',
    header: 'League Stage',
    sortable: false,
    width: '15%',
    render: (match: MatchWithStageDetails) => (
      <div className="text-sm">
        {(match.esports_seasons_stages?.competition_stage ?? 'N/A')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())}
      </div>
    )
  },
  {
    key: 'venue',
    header: 'Venue',
    sortable: true,
    width: '15%',
    render: (match: MatchWithStageDetails) => (
      <div className="flex items-center space-x-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{match.venue}</span>
      </div>
    )
  },
  {
    key: 'scheduled',
    header: 'Scheduled',
    sortable: true,
    width: '20%',
    render: (match: MatchWithStageDetails) => (
      <div className="space-y-1">
        {match.scheduled_at ? (
          <>
            <div className="text-sm font-medium">
              {formatUtcForDisplay(match.scheduled_at)}
            </div>
            {match.start_at && (
              <div className="text-xs text-muted-foreground">
                Start: {formatUtcForDisplay(match.start_at)}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Not scheduled
          </div>
        )}
      </div>
    )
  }
];

export const getMatchesTableActions = (
  onEdit: (match: MatchWithStageDetails) => void,
  onDelete: (match: MatchWithStageDetails) => void,
  onView: (match: MatchWithStageDetails) => void,
) => [
    {
      key: 'view',
      label: 'View Match Details',
      icon: <Eye className='h-4 w-4' />,
      onClick: onView,
      variant: 'ghost' as const,
      size: 'sm' as const
    },
    {
      key: 'edit',
      label: 'Edit Match',
      icon: <Pencil className="h-4 w-4" />,
      onClick: onEdit,
      variant: 'ghost' as const,
      size: 'sm' as const
    },
    {
      key: 'delete',
      label: 'Delete Match',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'ghost' as const,
      size: 'sm' as const
    }
  ];
