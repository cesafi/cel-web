import { useMutation, useQuery } from '@tanstack/react-query';
import { loginAction, logoutAction, checkAuthAction } from '@/actions/auth';
import { LoginFormData } from '@/lib/validations/auth';

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password, turnstileToken }: LoginFormData) => loginAction(email, password, turnstileToken),
    onError: (error: Error) => {
      if (error.message !== 'NEXT_REDIRECT') {
        console.error('Login error:', error);
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        console.log('Login successful:', result);
      }
    }
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: logoutAction,
    onError: (error: Error) => {
      if (error.message !== 'NEXT_REDIRECT') {
        console.error('Logout error:', error);
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        console.log('Logout successful');
      }
    }
  });
}

export function useCheckAuth(requiredRoles: string[] = []) {
  return useQuery({
    queryKey: ['auth', 'check', requiredRoles],
    queryFn: () => checkAuthAction(requiredRoles),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
}

