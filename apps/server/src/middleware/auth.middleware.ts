import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, supabaseAnon } from '../db/supabase.js';
import { config } from '../config/index.js';

// Extend Express Request interface to include the authenticated user object
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
        metadata?: Record<string, any>;
      };
    }
  }
}

/**
 * Authentication Middleware: requireAuth
 * 
 * WHY IS THIS CRITICAL FOR SECURITY?
 * A naive backend might accept a user ID from the request body or query parameter (e.g. PATCH /profile?userId=123).
 * That is a catastrophic security vulnerability (Insecure Direct Object Reference / IDOR).
 * Any malicious client could modify ANY user's profile simply by passing another user's ID.
 * 
 * Our middleware derives the user's identity EXCLUSIVELY from a cryptographically signed
 * JSON Web Token (JWT) issued by Supabase Auth and sent in the 'Authorization: Bearer <token>' header.
 * The client CANNOT forge or tamper with this token without invalidating its signature.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is missing or must follow format: Bearer <token>',
        },
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Bearer token string is empty',
        },
      });
      return;
    }

    // Fast-path / Mocking for automated testing in CI/test environments
    if (config.isTest && token === 'test-valid-token') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'testuser@example.com',
        role: 'authenticated',
        metadata: { name: 'Test User' },
      };
      return next();
    }

    // Verify token with Supabase Auth service
    const { data, error } = await supabaseAnon.auth.getUser(token);

    if (error || !data?.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error?.message || 'Access token is invalid, expired, or revoked',
        },
      });
      return;
    }

    // Attach verified user identity from trusted claims to the request object
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: data.user.role,
      metadata: data.user.user_metadata,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Token verification encountered an unexpected error: ' + error.message,
      },
    });
  }
}
