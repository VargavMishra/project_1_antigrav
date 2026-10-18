import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Production-Grade Shared Full-Stack Profile & Auth API',
    version: '1.0.0',
    description: `
API documentation for the shared full-stack synchronization system.
Provides unified profile data and real-time syncing between:
1. Publicly accessible React + Vite Website
2. Physical Android Device running React Native / Expo WebView APK
3. Supabase PostgreSQL database with triggers and RLS policies.
    `,
    contact: {
      name: 'Vargav Mishra',
      email: 'vargavmishra2002@gmail.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server',
    },
    {
      url: 'https://fullstack-shared-server.onrender.com',
      description: 'Production Remote API (Render)',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your Supabase JWT access token obtained via email, Google OAuth, or Phone OTP.',
      },
    },
    schemas: {
      StandardError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'UNAUTHORIZED' },
              message: { type: 'string', example: 'Invalid or missing authentication token' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
          display_name: { type: 'string', example: 'Alex Developer' },
          avatar_url: { type: 'string', example: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' },
          bio: { type: 'string', example: 'Full-stack software engineer building synced web and mobile apps.' },
          gender: { type: 'string', enum: ['male', 'female', 'non-binary', 'other', 'unspecified'], example: 'male' },
          hobbies: {
            type: 'array',
            items: { type: 'string' },
            example: ['Coding', 'Cycling', 'Reading tech docs'],
          },
          strengths: {
            type: 'array',
            items: { type: 'string' },
            example: ['System Architecture', 'Debugging', 'TypeScript'],
          },
          created_at: { type: 'string', format: 'date-time', example: '2026-10-18T10:00:00.000Z' },
          updated_at: { type: 'string', format: 'date-time', example: '2026-10-18T12:30:00.000Z' },
        },
      },
      UpdateProfileInput: {
        type: 'object',
        properties: {
          display_name: { type: 'string', minLength: 1, maxLength: 100, example: 'Alex Developer' },
          bio: { type: 'string', maxLength: 500, example: 'Building production distributed systems.' },
          gender: { type: 'string', enum: ['male', 'female', 'non-binary', 'other', 'unspecified'], example: 'non-binary' },
          hobbies: {
            type: 'array',
            items: { type: 'string' },
            example: ['Open Source', 'Coffee Brewing'],
          },
          strengths: {
            type: 'array',
            items: { type: 'string' },
            example: ['PostgreSQL', 'Express API', 'React'],
          },
          avatar_url: { type: 'string', format: 'uri', example: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' },
        },
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          action: { type: 'string', example: 'UPDATE' },
          old_data: { type: 'object' },
          new_data: { type: 'object' },
          performed_at: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'System health check and database connectivity verification',
        description: 'Returns operational uptime, memory usage, environment, and Supabase database latency.',
        responses: {
          '200': {
            description: 'API and database are operational',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    uptimeSeconds: { type: 'number', example: 120 },
                    services: {
                      type: 'object',
                      properties: {
                        api: { type: 'string', example: 'operational' },
                        database: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/profile/me': {
      get: {
        summary: 'Get current user profile',
        description: 'Fetches the profile for the authenticated user derived from the Bearer JWT token.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Profile fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Profile' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Missing or invalid token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
        },
      },
      patch: {
        summary: 'Update current user profile',
        description: 'Updates fields on the user profile. Automatically triggers updated_at in PostgreSQL.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Profile' },
                    message: { type: 'string', example: 'Profile updated successfully' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
        },
      },
    },
    '/api/v1/profile/me/avatar': {
      post: {
        summary: 'Update profile avatar URL',
        description: 'Updates the avatar picture URL for the authenticated user.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['avatar_url'],
                properties: {
                  avatar_url: { type: 'string', example: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Avatar updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/Profile' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/v1/profile/me/audit-logs': {
      get: {
        summary: 'Get profile modification audit trail',
        description: 'Retrieves audit entries showing historical edits made to the authenticated user profile.',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Audit logs retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AuditLog' },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardError' },
              },
            },
          },
        },
      },
    },
  },
};

export function setupSwagger(app: Express): void {
  // Serve Swagger UI documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  // Serve raw OpenAPI JSON specification
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openApiSpec);
  });
}
