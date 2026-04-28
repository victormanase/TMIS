import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as usersService from '../services/users.service';
import { success, created, paginated } from '../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const { users, total } = await usersService.listUsers(page, limit, search);
    paginated(res, users, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUser(String(req.params.id));
    success(res, user);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body);
    created(res, user);
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(String(req.params.id), req.body);
    success(res, user);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await usersService.deleteUser(String(req.params.id));
    success(res, null, 'User deleted');
  } catch (err) {
    next(err);
  }
}

export async function toggleActive(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await usersService.toggleActive(String(req.params.id));
    success(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
}
