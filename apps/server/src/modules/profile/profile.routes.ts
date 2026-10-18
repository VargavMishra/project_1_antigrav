import { Router } from 'express';
import { profileController } from './profile.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Protect ALL profile routes behind JWT authentication middleware
router.use(requireAuth);

/**
 * @route   GET /api/v1/profile/me
 * @desc    Get the current authenticated user's profile
 * @access  Private (JWT required)
 */
router.get('/me', (req, res, next) => profileController.getMe(req, res, next));

/**
 * @route   PATCH /api/v1/profile/me
 * @desc    Update editable fields on the authenticated user's profile
 * @access  Private (JWT required)
 */
router.patch('/me', (req, res, next) => profileController.patchMe(req, res, next));

/**
 * @route   POST /api/v1/profile/me/avatar
 * @desc    Update the avatar URL of the authenticated user
 * @access  Private (JWT required)
 */
router.post('/me/avatar', (req, res, next) => profileController.postAvatar(req, res, next));

/**
 * @route   GET /api/v1/profile/me/audit-logs
 * @desc    Fetch audit log entries tracking changes to the profile
 * @access  Private (JWT required)
 */
router.get('/me/audit-logs', (req, res, next) => profileController.getAuditLogs(req, res, next));

export default router;
