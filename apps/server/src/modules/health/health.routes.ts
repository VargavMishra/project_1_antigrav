import { Router, Request, Response } from 'express';
import { checkDatabaseConnection } from '../../db/supabase.js';
import { config } from '../../config/index.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint verifying system, memory, uptime, and database status
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseConnection();

  const isHealthy = dbHealth.connected || config.supabase.url.includes('placeholder');

  const healthPayload = {
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.env,
    memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024)),
    services: {
      api: 'operational',
      database: {
        status: dbHealth.connected ? 'connected' : 'disconnected',
        latencyMs: dbHealth.latencyMs,
        ...(dbHealth.error ? { error: dbHealth.error } : {}),
      },
    },
  };

  const statusCode = isHealthy ? 200 : 503;
  res.status(statusCode).json(healthPayload);
});

export default router;
