import { UserRole } from '@/lib/types/auth';

/**
 * Converts a UserRole enum value to a human-readable display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    admin: 'Admin',
    head_writer: 'Head Writer',
    league_operator: 'League Operator',
    writer: 'Writer'
  };
  return roleMap[role] || role;
}

/**
 * Gets all available user roles with their display names and descriptions
 */
export const USER_ROLES = [
  {
    value: 'admin' as UserRole,
    label: 'Admin',
    description: 'Full system access and user management'
  },
  {
    value: 'head_writer' as UserRole,
    label: 'Head Writer',
    description: 'Content management and writer oversight'
  },
  {
    value: 'league_operator' as UserRole,
    label: 'League Operator',
    description: 'Game and match management'
  },
  {
    value: 'writer' as UserRole,
    label: 'Writer',
    description: 'Content creation and editing'
  }
] as const;






