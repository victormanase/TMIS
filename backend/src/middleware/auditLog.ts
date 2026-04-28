import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../lib/prisma';

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

function entityFromPath(path: string): { entity: string; entityId: string } {
  const parts = path.replace(/^\/api\//, '').split('/');
  const entity = parts[0] ?? 'unknown';
  const entityId = parts[1] ?? '';
  return { entity, entityId };
}

function actionFromMethod(method: string, path: string): string {
  if (method === 'POST') return 'CREATE';
  if (method === 'DELETE') return 'DELETE';
  if (method === 'PUT' || method === 'PATCH') {
    if (path.includes('toggle-active')) return 'TOGGLE_ACTIVE';
    if (path.includes('checkout')) return 'CHECKOUT';
    return 'UPDATE';
  }
  return method;
}

export function auditLog(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!MUTATION_METHODS.includes(req.method) || !req.user) return next();

  const originalJson = res.json.bind(res);

  res.json = function (body: unknown) {
    if (res.statusCode < 400 && req.user) {
      const { entity, entityId } = entityFromPath(req.path);
      const action = actionFromMethod(req.method, req.path);
      const resolvedId =
        entityId ||
        (body && typeof body === 'object' && (body as any).data?.id) ||
        'unknown';

      prisma.auditLog
        .create({
          data: {
            userId: req.user.userId,
            action,
            entity,
            entityId: String(resolvedId),
            changes: req.body ?? null,
          },
        })
        .catch((err) => console.error('Audit log error:', err));
    }
    return originalJson(body);
  };

  next();
}
