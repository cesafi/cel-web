import { z } from 'zod';

export const LoginSchema = z.object({
  email: z
    .email({ message: 'Please enter a valid email address.' })
    .min(1, { message: 'Email is required.' }),
  password: z
    .string()
    .min(1, { message: 'Password is required.' })
    .min(6, { message: 'Password must be at least 6 characters long.' }),
  turnstileToken: z
    .string()
    .min(1, { message: 'Please complete the security verification.' })
});

export type LoginFormData = z.infer<typeof LoginSchema>;
