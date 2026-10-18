import { z } from 'zod';

/**
 * Zod Schema for updating a User Profile.
 * Performs runtime sanitization and validation on incoming client requests.
 */
export const updateProfileSchema = z.object({
  display_name: z
    .string({ invalid_type_error: 'Display name must be a string' })
    .min(1, 'Display name cannot be empty')
    .max(100, 'Display name cannot exceed 100 characters')
    .trim()
    .optional(),
  bio: z
    .string({ invalid_type_error: 'Bio must be a string' })
    .max(500, 'Bio cannot exceed 500 characters')
    .trim()
    .optional(),
  gender: z
    .enum(['male', 'female', 'non-binary', 'other', 'unspecified'], {
      errorMap: () => ({ message: "Gender must be one of: 'male', 'female', 'non-binary', 'other', 'unspecified'" }),
    })
    .optional(),
  hobbies: z
    .array(z.string().min(1, 'Hobby item cannot be empty').max(50, 'Each hobby cannot exceed 50 characters').trim())
    .max(20, 'You cannot specify more than 20 hobbies')
    .optional(),
  strengths: z
    .array(z.string().min(1, 'Strength item cannot be empty').max(50, 'Each strength cannot exceed 50 characters').trim())
    .max(20, 'You cannot specify more than 20 strengths')
    .optional(),
  avatar_url: z
    .string()
    .url('Avatar URL must be a valid HTTPS URL')
    .or(z.literal(''))
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const uploadAvatarSchema = z.object({
  avatar_url: z
    .string({ required_error: 'avatar_url is required' })
    .min(1, 'avatar_url cannot be empty'),
});

export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;

export interface ProfileRecord {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  gender: string;
  hobbies: string[];
  strengths: string[];
  created_at: string;
  updated_at: string;
}
