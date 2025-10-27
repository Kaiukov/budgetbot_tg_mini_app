/**
 * Cloudflare Pages Function - Middleware (Pass-through)
 *
 * NOTE: This middleware is now a pass-through only.
 * The application calls the backend API directly in production.
 * This file is kept for compatibility but does not intercept /api/* requests.
 *
 * Architecture:
 * - Development: Browser → Vite proxy → nginx → backend
 * - Production: Browser → nginx directly → backend (CORS handled by nginx)
 */

interface PagesContext {
  request: Request;
  env: any;
  next: () => Promise<Response>;
}

export const onRequest = async (context: PagesContext): Promise<Response> => {
  // Pass through all requests without interception
  // Services (firefly.ts, sync.ts) handle backend URLs directly
  return context.next();
};
