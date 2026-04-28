import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { success } from '../utils/response';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    success(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.user!.userId);
    success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
}

export async function requestPasswordReset(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.requestPasswordReset(req.body.email);
    success(res, null, 'If that email exists, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
}

export async function confirmPasswordReset(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    await authService.confirmPasswordReset(token, password);
    success(res, null, 'Password reset successfully');
  } catch (err) {
    next(err);
  }
}
