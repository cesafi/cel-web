import { TableColumn, TableAction } from '@/lib/types/table';
import { MatchParticipantWithFullDetails } from '@/lib/types/match-participants';
import { formatTableDate } from '@/lib/utils/date';
import { Badge } from '@/components/ui/badge';
import { Trophy, Trash2, School } from 'lucide-react';

export const getMatchParticipantsTableColumns = (): TableColumn<MatchParticipantWithFullDetails>[] => [
  {
    key: 'teamInfo',
    header: 'Team',
    sortable: true,
    render: (participant) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="text-primary h-5 w-5" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            {participant.schools_teams.schools.abbreviation} {participant.schools_teams.name}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'school',
    header: 'School',
    sortable: true,
    render: (participant) => (
      <div className="flex items-center space-x-2">
        <School className="h-4 w-4 text-muted-foreground" />
        <div>
          <div className="text-sm font-medium">{participant.schools_teams.schools.name}</div>
          <div className="text-xs text-muted-foreground">{participant.schools_teams.schools.abbreviation}</div>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: false,
    render: (_participant) => (
      <Badge variant="secondary" style={{ backgroundColor: 'var(--color-emerald)' }}>
        Active
      </Badge>
    )
  },
  {
    key: 'joinedAt',
    header: 'Joined Match',
    sortable: true,
    render: (participant) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(participant.created_at)}
      </div>
    )
  }
];

export const getMatchParticipantsTableActions = (
  onRemove: (participant: MatchParticipantWithFullDetails) => void
): TableAction<MatchParticipantWithFullDetails>[] => [
    {
      key: 'remove',
      label: 'Remove from Match',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onRemove,
      variant: 'ghost',
      size: 'sm'
    }
  ];
