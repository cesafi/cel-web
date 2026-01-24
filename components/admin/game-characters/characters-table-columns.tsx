'use client';

import { TableColumn } from '@/lib/types/table';
import { GameCharacter } from '@/lib/types/game-characters';
import { Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';

export const getCharactersTableColumns = (): TableColumn<GameCharacter>[] => [
  {
    key: 'icon',
    header: 'Icon',
    sortable: false,
    width: '80px',
    render: (character: GameCharacter) => (
      <div className="flex items-center justify-center">
        {character.icon_url ? (
          <Image
            src={character.icon_url}
            alt={character.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-medium text-muted-foreground">
            {character.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    )
  },
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    width: '40%',
    render: (character: GameCharacter) => (
      <div className="font-medium">{character.name}</div>
    )
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    width: '30%',
    render: (character: GameCharacter) => (
      <div className="text-sm text-muted-foreground capitalize">{character.role}</div>
    )
  }
];

export const getCharactersTableActions = (
  onEdit: (character: GameCharacter) => void,
  onDelete: (character: GameCharacter) => void
) => [
  {
    key: 'edit',
    label: 'Edit Character',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Character',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const
  }
];
