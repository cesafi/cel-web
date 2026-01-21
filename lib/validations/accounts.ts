import { z } from 'zod';

export const createAccountSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').trim(),
  email: z.email('Please enter a valid email address').min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  role: z.enum(['admin', 'head_writer', 'league_operator', 'writer'] as const)
});

export const updateAccountRoleSchema = z.object({
  role: z.enum(['admin', 'head_writer', 'league_operator', 'writer'] as const)
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  });

export const updateAccountSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').trim(),
  email: z.email('Please enter a valid email address').min(1, 'Email is required'),
  password: z
    .string()
    .optional()
    .refine((val) => {
      if (val && val.trim() !== '') {
        return (
          val.length >= 8 &&
          /[a-z]/.test(val) &&
          /[A-Z]/.test(val) &&
          /[0-9]/.test(val) &&
          /[^a-zA-Z0-9]/.test(val)
        );
      }
      return true;
    }, 'Password must be at least 8 characters long and contain lowercase, uppercase, numbers, and special characters'),
  role: z.enum(['admin', 'head_writer', 'league_operator', 'writer'] as const)
});

// Export inferred types
export type CreateAccountFormData = z.infer<typeof createAccountSchema>;
export type UpdateAccountFormData = z.infer<typeof updateAccountSchema>;
export type UpdateAccountRoleFormData = z.infer<typeof updateAccountRoleSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;