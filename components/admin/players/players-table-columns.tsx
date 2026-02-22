'use client';

import { TableColumn } from '@/lib/types/table';
import { PlayerWithTeam } from '@/lib/types/players';
import { Pencil, Trash2, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';
import Image from 'next/image';

export const getPlayersTableColumns = (): TableColumn<PlayerWithTeam>[] => [
  {
    key: 'player',
    header: 'Player',
    sortable: true,
    width: '30%',
    render: (player: PlayerWithTeam) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted">
            {player.photo_url ? (
               <Image
                 src={player.photo_url}
                 alt={player.ign}
                 width={40}
                 height={40}
                 className="h-10 w-10 rounded-full object-cover"
               />
             ) : (
               <span className="text-sm font-medium text-muted-foreground">
                 {player.ign.charAt(0).toUpperCase()}
               </span>
             )}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">{player.ign}</div>
          {(player.first_name || player.last_name) && (
            <div className="text-xs text-muted-foreground truncate">
              {[player.first_name, player.last_name].filter(Boolean).join(' ')}
            </div>
          )}
        </div>
      </div>
    )
  },
  {
    key: 'team',
    header: 'Latest Team',
    sortable: true,
    width: '25%',
    render: (player: PlayerWithTeam) => (
      <div className="text-sm">
        {player.schools_teams ? (
          <div>
            <div className="font-medium">{player.schools_teams.name}</div>
            {player.schools_teams.schools && (
              <div className="text-xs text-muted-foreground">
                {player.schools_teams.schools.abbreviation}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">No team</span>
        )}
      </div>
    )
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    width: '15%',
    render: (player: PlayerWithTeam) => (
      <div className="text-sm text-muted-foreground">
        {player.role || '—'}
      </div>
    )
  },
  {
    key: 'is_active',
    header: 'Status',
    sortable: true,
    width: '15%',
    render: (player: PlayerWithTeam) => (
      <Badge
        className={`${player.is_active
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-muted text-muted-foreground border-muted'
          } border`}
      >
        {player.is_active ? 'Active' : 'Inactive'}
      </Badge>
    )
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    width: '15%',
    render: (player: PlayerWithTeam) => (
      <div className="text-sm text-muted-foreground">
        {formatTableDate(player.created_at)}
      </div>
    )
  }
];

export const getPlayersTableActions = (
  onEdit: (player: PlayerWithTeam) => void,
  onDelete: (player: PlayerWithTeam) => void,
  onViewHistory?: (player: PlayerWithTeam) => void
) => [
    ...(onViewHistory ? [{
      key: 'history',
      label: 'Team History',
      icon: <History className="h-4 w-4" />,
      onClick: onViewHistory,
      variant: 'ghost' as const,
      size: 'sm' as const
    }] : []),
    {
      key: 'edit',
      label: 'Edit Player',
      icon: <Pencil className="h-4 w-4" />,
      onClick: onEdit,
      variant: 'ghost' as const,
      size: 'sm' as const
    },
    {
      key: 'delete',
      label: 'Delete Player',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: onDelete,
      variant: 'ghost' as const,
      size: 'sm' as const
    }
  ];

