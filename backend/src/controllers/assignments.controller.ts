import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as assignmentsService from '../services/assignments.service';
import { success, created } from '../utils/response';

export async function assign(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    created(res, await assignmentsService.assignTenant(req.body), 'Tenant assigned successfully');
  } catch (err) {
    next(err);
  }
}

export async function getByUnit(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await assignmentsService.getAssignmentsByUnit(String(req.params.unitId)));
  } catch (err) {
    next(err);
  }
}

export async function checkout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await assignmentsService.checkoutTenant(String(req.params.id)), 'Tenant checked out');
  } catch (err) {
    next(err);
  }
}
