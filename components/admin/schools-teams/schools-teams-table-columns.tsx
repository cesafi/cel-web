import { TableColumn } from '@/lib/types/table';
import { SchoolsTeamWithSportDetails } from '@/lib/types/schools-teams';
import { formatTableDate } from '@/lib/utils/date';
import { Pencil, Trash2, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCategoryName } from '@/lib/utils/sports';

export const getSchoolsTeamsTableColumns = (): TableColumn<SchoolsTeamWithSportDetails>[] => [
  {
    key: 'teamInfo',
    header: 'Team Information',
    sortable: false,
    width: '35%',
    render: (team: SchoolsTeamWithSportDetails) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="text-primary h-5 w-5" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">{team.name}</div>
          <div className="text-xs text-muted-foreground">Team</div>
        </div>
      </div>
    )
  },
  {
    key: 'sportInfo',
    header: 'Sport & Category',
    sortable: false,
    width: '30%',
    render: (team: SchoolsTeamWithSportDetails) => (
      <div className="space-y-1">
        <div className="text-sm font-medium">{team.esports_categories?.esports?.name || 'Unknown'}</div>
        <div className="text-xs text-muted-foreground">
          {formatCategoryName(team.esports_categories?.division || '', team.esports_categories?.levels || '')}
        </div>
      </div>
    )
  },
  {
    key: 'seasonInfo',
    header: 'Season',
    sortable: false,
    width: '15%',
    render: (team: SchoolsTeamWithSportDetails) => (
      <div className="text-sm">Season {team.season_id}</div>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    width: '10%',
    render: (team: SchoolsTeamWithSportDetails) => (
      <Badge 
        className={`${team.is_active 
          ? 'bg-green-100 text-green-800 border-green-200' 
          : 'bg-muted text-muted-foreground border-muted'
        } border`}
      >
        {team.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '10%',
    render: (team: SchoolsTeamWithSportDetails) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(team.created_at)}
      </div>
    )
  }
];

export const getSchoolsTeamsTableActions = (
  onEdit: (team: SchoolsTeamWithSportDetails) => void,
  onDelete: (team: SchoolsTeamWithSportDetails) => void
) => [
  {
    key: 'edit',
    label: 'Edit Team',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Team',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];