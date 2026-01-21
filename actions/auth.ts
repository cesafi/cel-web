'use server';

import { AuthService } from '@/services/auth';
import { revalidatePath } from 'next/cache';

export async function loginAction(email: string, password: string, turnstileToken?: string) {
  const result = await AuthService.login(email, password, turnstileToken);

  if (result.success) {
    revalidatePath('/');
    return result;
  }

  return result;
}

export async function logoutAction() {
  const result = await AuthService.logout();

  if (result.success) {
    revalidatePath('/');
    // Return success result - let the client handle the redirect
    // The client can navigate to login page after successful logout
    return result;
  }

  return result;
}

export async function checkAuthAction(requiredRoles: string[] = []) {
  return await AuthService.checkAuth(requiredRoles);
}

export async function getCurrentUserAction() {
  try {
    const { getSupabaseServer } = await import('@/lib/supabase/server');
    const supabase = await getSupabaseServer();
    
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const userData = {
      id: user.id,
      email: user.email,
      userRole: user.app_metadata?.role as string | undefined,
      userName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    };

    return { success: true, data: userData };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get user data' 
    };
  }
}
