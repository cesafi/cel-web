import { TableColumn } from '@/lib/types/table';
import { GameWithDetails } from '@/lib/types/games';
import { formatTableDate } from '@/lib/utils/date';
import { Trash2, Play, Clock, Trophy, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const getMatchGamesTableColumns = (): TableColumn<GameWithDetails>[] => [
  {
    key: 'gameInfo',
    header: 'Game Information',
    sortable: true,
    width: '25%',
    render: (game: GameWithDetails) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="text-primary h-5 w-5" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            Game {game.game_number}
          </div>
          <div className="text-xs text-muted-foreground">
            Match ID: {game.match_id}
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: false,
    width: '15%',
    render: (game: GameWithDetails) => {
      if (game.start_at && game.end_at) {
        return <Badge variant="secondary" style={{ backgroundColor: 'var(--color-emerald)' }}>Completed</Badge>;
      } else if (game.start_at) {
        return <Badge variant="secondary" style={{ backgroundColor: 'var(--color-amber)' }}>In Progress</Badge>;
      } else {
        return <Badge variant="secondary" style={{ backgroundColor: 'var(--color-slate)' }}>Scheduled</Badge>;
      }
    }
  },
  {
    key: 'timing',
    header: 'Timing',
    sortable: true,
    width: '30%',
    render: (game: GameWithDetails) => (
      <div className="space-y-1">
        {game.start_at ? (
          <>
            <div className="flex items-center space-x-2">
              <Play className="h-3 w-3 text-green-600" />
              <span className="text-xs text-muted-foreground">Started:</span>
              {formatTableDate(game.start_at)}
            </div>
            {game.end_at && (
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-red-600" />
                <span className="text-xs text-muted-foreground">Ended:</span>
                {formatTableDate(game.end_at)}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            Not started
          </div>
        )}
      </div>
    )
  },
  {
    key: 'scores',
    header: 'Scores',
    sortable: false,
    width: '20%',
    render: (_game: GameWithDetails) => (
      <div className="text-sm">
        {/* This will be populated with actual scores */}
        <span className="text-muted-foreground">Click &quot;Manage Scores&quot;</span>
      </div>
    )
  },
  {
    key: 'duration',
    header: 'Duration',
    sortable: false,
    width: '15%',
    render: (game: GameWithDetails) => (
      <div className="text-sm">
        {game.duration ? (
          <span className="font-medium">{game.duration}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </div>
    )
  },
  {
    key: 'created',
    header: 'Created',
    sortable: true,
    width: '15%',
    render: (game: GameWithDetails) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(game.created_at)}
      </div>
    )
  }
];

export const getMatchGamesTableActions = (
  onEdit: (game: GameWithDetails) => void,
  onDelete: (game: GameWithDetails) => void,
  onManageScores: (game: GameWithDetails) => void,
) => [
    {
      key: 'manageScores',
      label: 'Manage Scores',
      icon: <Target className="h-4 w-4" />,
      onClick: onManageScores,
      variant: 'ghost' as const,
      size: 'sm' as const
    },
    {
      key: 'delete',
      label: 'Delete Game',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'ghost' as const,
      size: 'sm' as const
    }
  ];