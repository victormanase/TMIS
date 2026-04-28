import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as propertiesService from '../services/properties.service';
import { success, created, paginated } from '../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const { properties, total } = await propertiesService.listProperties(page, limit, search);
    paginated(res, properties, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await propertiesService.getProperty(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    created(res, await propertiesService.createProperty(req.body));
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await propertiesService.updateProperty(String(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await propertiesService.deleteProperty(String(req.params.id));
    success(res, null, 'Property deleted');
  } catch (err) {
    next(err);
  }
}
