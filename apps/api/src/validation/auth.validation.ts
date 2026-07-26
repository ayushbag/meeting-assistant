import { z } from 'zod';

export const emailSchema = z
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be at most 255 characters' });

export const passwordSchema = z
    .string()
    .trim()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be at most 128 characters' })
    .regex(/(?=.*[a-z])/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/(?=.*[A-Z])/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/(?=.*\d)/, { message: 'Password must contain at least one number' })
    .regex(/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, {
        message: 'Password must contain at least one special character',
    });

export const registerSchema = z.object({
    name: z.string().trim().min(2, 'Name must have atleast 2 characters').max(255),
    email: emailSchema,
    password: passwordSchema,
});

export const loginSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
});
