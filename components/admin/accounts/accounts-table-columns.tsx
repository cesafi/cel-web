import { User, Calendar, Pencil, Trash2 } from 'lucide-react';
import { TableColumn } from '@/lib/types/table';
import { AccountEntity } from '@/lib/types/accounts';
import { Badge } from '@/components/ui/badge';
import { formatTableDate } from '@/lib/utils/date';

export const getAccountsTableColumns = (): TableColumn<AccountEntity>[] => [
  {
    key: 'accountInfo',
    header: 'Account Information',
    sortable: false,
    width: '40%',
    render: (account: AccountEntity) => (
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <User className="text-muted-foreground h-5 w-5" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
                     <p className="truncate text-sm font-medium">
             {account.displayName || 'No display name set'}
           </p>
           <p className="truncate text-xs text-muted-foreground">{account.email}</p>
          <div className="text-muted-foreground flex items-center space-x-2 text-xs">
            <Calendar className="h-3 w-3" />
            <span>Created {formatTableDate(account.createdAt)}</span>
          </div>
        </div>
      </div>
    )
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    width: '30%',
    render: (account: AccountEntity) => (
      <Badge
        variant={
          account.role === 'admin'
            ? 'default'
            : account.role === 'head_writer'
              ? 'secondary'
              : account.role === 'league_operator'
                ? 'outline'
                : 'secondary'
        }
        className="capitalize"
      >
        {account.role.replace('_', ' ')}
      </Badge>
    )
  },
  {
    key: 'lastSignIn',
    header: 'Last Sign In',
    sortable: true,
    width: '30%',
    render: (account: AccountEntity) => (
      <div className="text-muted-foreground text-sm">
        {account.lastSignInAt ? (
          <span>{formatTableDate(account.lastSignInAt)}</span>
        ) : (
          <span className="text-muted-foreground">Never</span>
        )}
      </div>
    )
  }
];

export const getAccountsTableActions = (
  onEdit: (account: AccountEntity) => void,
  onDelete: (account: AccountEntity) => void
) => [
  {
    key: 'edit',
    label: 'Edit Account',
    icon: <Pencil className="h-4 w-4" />,
    onClick: onEdit,
    variant: 'ghost' as const,
    size: 'sm' as const
  },
  {
    key: 'delete',
    label: 'Delete Account',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: onDelete,
    variant: 'ghost' as const,
    size: 'sm' as const,
    disabled: (account: AccountEntity) => account.role === 'admin'
  }
];
