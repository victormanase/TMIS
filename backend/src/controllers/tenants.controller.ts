import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as tenantsService from '../services/tenants.service';
import { success, created, paginated } from '../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { tenants, total } = await tenantsService.listTenants(
      page,
      limit,
      req.query.search as string | undefined
    );
    paginated(res, tenants, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await tenantsService.getTenant(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    created(res, await tenantsService.createTenant(req.body));
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await tenantsService.updateTenant(String(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await tenantsService.deleteTenant(String(req.params.id));
    success(res, null, 'Tenant deleted');
  } catch (err) {
    next(err);
  }
}
