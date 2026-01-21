import { ServiceResponse } from '@/lib/types/base';
import { BaseService } from './base';
import { AuthCheckResult, LoginResult, UserRole } from '@/lib/types/auth';
import { verifyTurnstileToken } from '@/lib/utils/turnstile';

export class AuthService extends BaseService {
  static async login(email: string, password: string, turnstileToken?: string): Promise<LoginResult> {
    if (!email || !password) {
      return { success: false, error: 'Email or Password is missing.' };
    }

    // Verify Turnstile token if provided
    if (turnstileToken) {
      const isValidToken = await verifyTurnstileToken(turnstileToken);
      if (!isValidToken) {
        return { success: false, error: 'Security verification failed. Please try again.' };
      }
    }

    try {
      const supabase = await this.getClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.session || !data.user) {
        return {
          success: false,
          error:
            'Login successful, but no active session found. Please check your email for verification if required.'
        };
      }

      const userRole = data.user.app_metadata?.role as UserRole | undefined;

      return { success: true, userRole };
    } catch (_) {
      return { success: false, error: 'Failed to login' };
    }
  }

  static async logout(): Promise<ServiceResponse<undefined>> {
    try {
      const supabase = await this.getClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return this.formatError(error, 'Failed to log out');
    }
  }

  static async checkAuth(requiredRoles: string[] = []): Promise<AuthCheckResult> {
    try {
      const supabase = await this.getClient();

      const {
        data: { user },
        error
      } = await supabase.auth.getUser();

      if (error || !user) {
        return {
          authenticated: false,
          authorized: false,
          error: error?.message || 'Authentication required to perform this action.'
        };
      }

      const userRole = user.app_metadata?.role as UserRole | undefined;
      const userRoles: string[] = userRole ? [userRole] : [];

      if (requiredRoles.length === 0) {
        return {
          authenticated: true,
          authorized: true,
          userRole,
          userRoles: userRoles
        };
      }

      const isAuthorized = requiredRoles.some((role) => userRoles.includes(role));

      if (!isAuthorized) {
        return {
          authenticated: true,
          authorized: false,
          error: 'You do not have the required permissions to perform this action.',
          userRole,
          userRoles: userRoles
        };
      }

      return {
        authenticated: true,
        authorized: true,
        userRole,
        userRoles: userRoles
      };
    } catch (error) {
      return {
        authenticated: false,
        authorized: false,
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred during authentication check.'
      };
    }
  }
}
