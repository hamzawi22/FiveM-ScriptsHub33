import { z } from 'zod';
import { insertScriptSchema, scripts, analytics } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  scripts: {
    list: {
      method: 'GET' as const,
      path: '/api/scripts',
      input: z.object({
        search: z.string().optional(),
        duration: z.enum(["day", "week", "month"]).optional(),
        sortBy: z.enum(["recent", "trending", "topViews"]).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof scripts.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/scripts/:id',
      responses: {
        200: z.custom<typeof scripts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/scripts',
      input: insertScriptSchema,
      responses: {
        201: z.custom<typeof scripts.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    scan: {
      method: 'POST' as const,
      path: '/api/scripts/:id/scan',
      responses: {
        200: z.object({
          status: z.enum(["pending", "clean", "infected"]),
          hasFxManifest: z.boolean(),
          report: z.string().optional()
        }),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/scripts/:id',
      responses: {
        204: z.void(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    }
  },
  profiles: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:userId',
      responses: {
        200: z.object({
          id: z.string(),
          email: z.string(),
          firstName: z.string().optional(),
          bio: z.string().optional(),
          followers: z.number(),
          following: z.number(),
          totalEarnings: z.number(),
          coins: z.number(),
        }),
        404: errorSchemas.notFound,
      },
    },
    follow: {
      method: 'POST' as const,
      path: '/api/users/:userId/follow',
      responses: {
        200: z.object({ followed: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
    getUserScripts: {
      method: 'GET' as const,
      path: '/api/users/:userId/scripts',
      responses: {
        200: z.array(z.custom<typeof scripts.$inferSelect>()),
      },
    },
  },
  analytics: {
    track: {
      method: 'POST' as const,
      path: '/api/analytics',
      input: z.object({
        scriptId: z.number(),
        type: z.enum(["view", "download"]),
        country: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof analytics.$inferSelect>(),
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/scripts/:id/stats',
      responses: {
        200: z.object({
          views: z.number(),
          downloads: z.number(),
          earnings: z.number(),
          byCountry: z.record(z.number()),
        }),
      },
    },
  },
  subscription: {
    purchase: {
      method: 'POST' as const,
      path: '/api/subscription/purchase',
      input: z.object({
        tier: z.enum(["monthly", "quarterly", "yearly"]),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    getStatus: {
      method: 'GET' as const,
      path: '/api/subscription/status',
      responses: {
        200: z.object({
          tier: z.enum(["free", "monthly", "quarterly", "yearly"]),
          expiresAt: z.string().optional(),
          coins: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
