import { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service.js';
import { updateProfileSchema, uploadAvatarSchema } from './profile.schema.js';
import { AppError } from '../../middleware/error.middleware.js';

export class ProfileController {
  /**
   * GET /api/v1/profile/me
   * Fetches the authenticated user's profile.
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user?.id) {
        throw new AppError('User context not found in request', 401, 'UNAUTHORIZED');
      }

      const profile = await profileService.getProfile(user.id, user.email, user.metadata);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/profile/me
   * Modifies fields on the authenticated user's profile.
   */
  async patchMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user?.id) {
        throw new AppError('User context not found in request', 401, 'UNAUTHORIZED');
      }

      // Validate the incoming JSON body with Zod
      const validatedInput = updateProfileSchema.parse(req.body);

      // Disallow empty update payload
      if (Object.keys(validatedInput).length === 0) {
        throw new AppError('No valid profile fields provided for update', 400, 'BAD_REQUEST');
      }

      const updatedProfile = await profileService.updateProfile(user.id, validatedInput);

      res.status(200).json({
        success: true,
        data: updatedProfile,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/me/avatar
   * Updates the user's avatar URL.
   */
  async postAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user?.id) {
        throw new AppError('User context not found in request', 401, 'UNAUTHORIZED');
      }

      const { avatar_url } = uploadAvatarSchema.parse(req.body);
      const updatedProfile = await profileService.updateAvatar(user.id, avatar_url);

      res.status(200).json({
        success: true,
        data: updatedProfile,
        message: 'Profile avatar updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/profile/me/audit-logs
   * Retrieves audit logs for the current user's profile changes.
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user;
      if (!user?.id) {
        throw new AppError('User context not found in request', 401, 'UNAUTHORIZED');
      }

      const logs = await profileService.getAuditLogs(user.id);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
