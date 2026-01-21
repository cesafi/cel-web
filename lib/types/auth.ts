export type UserRole = 'admin' | 'head_writer' | 'league_operator' | 'writer';

export type AuthCheckResult = {
  authenticated: boolean;
  authorized: boolean;
  error?: string;
  userRole?: UserRole;
  userRoles?: string[];
};

export type LoginResult = {
  success: boolean;
  error?: string;
  userRole?: UserRole;
};
