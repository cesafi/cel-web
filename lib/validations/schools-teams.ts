import { z } from 'zod';

export const createSchoolTeamSchema = z.object({
  name: z
    .string({ message: 'Team name is required.' })
    .min(1, { message: 'Team name cannot be empty.' })
    .max(100, { message: 'Team name cannot exceed 100 characters.' })
    .trim(),
  school_id: z
    .string({ message: 'School ID is required.' })
    .min(1, { message: 'School ID cannot be empty.' })
    .uuid({ message: 'School ID must be a valid UUID.' }),
  season_id: z
    .number({ message: 'Season ID is required.' })
    .int({ message: 'Season ID must be an integer.' })
    .positive({ message: 'Season ID must be a positive number.' }),
  esport_category_id: z
    .number({ message: 'Esport category ID is required.' })
    .int({ message: 'Esport category ID must be an integer.' })
    .positive({ message: 'Esport category ID must be a positive number.' }),
  is_active: z
    .boolean({ message: 'Active status is required.' })
    .default(true)
});

export const updateSchoolTeamSchema = z.object({
  id: z
    .string({ message: 'ID is required for updating a school team.' })
    .min(1, { message: 'Team ID cannot be empty.' })
    .uuid({ message: 'Team ID must be a valid UUID.' }),
  name: z
    .string()
    .min(1, { message: 'Team name cannot be empty.' })
    .max(100, { message: 'Team name cannot exceed 100 characters.' })
    .trim()
    .optional(),
  school_id: z
    .string()
    .min(1, { message: 'School ID cannot be empty.' })
    .uuid({ message: 'School ID must be a valid UUID.' })
    .optional(),
  season_id: z
    .number()
    .int({ message: 'Season ID must be an integer.' })
    .positive({ message: 'Season ID must be a positive number.' })
    .optional(),
  esport_category_id: z
    .number()
    .int({ message: 'Esport category ID must be an integer.' })
    .positive({ message: 'Esport category ID must be a positive number.' })
    .optional(),
  is_active: z.boolean().optional()
});
