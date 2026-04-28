import { Response, NextFunction } from 'express';
import { UnitType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as unitsService from '../services/units.service';
import { success, created, paginated } from '../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { units, total } = await unitsService.listUnits(page, limit, {
      propertyId: req.query.propertyId as string | undefined,
      unitType: req.query.unitType as UnitType | undefined,
      search: req.query.search as string | undefined,
    });
    paginated(res, units, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await unitsService.getUnit(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    created(res, await unitsService.createUnit(req.body));
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await unitsService.updateUnit(String(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await unitsService.deleteUnit(String(req.params.id));
    success(res, null, 'Unit deleted');
  } catch (err) {
    next(err);
  }
}
