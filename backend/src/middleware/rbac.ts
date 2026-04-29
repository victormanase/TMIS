import { Response, NextFunction } from 'express';
type Role = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';

export function requireRoles(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new AppError('Unauthorized', 401));

    if (!roles.includes(req.user.role as Role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }
    next();
  };
}
