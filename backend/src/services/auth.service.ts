import crypto from 'crypto';
import prisma from '../lib/prisma';
import { comparePassword, hashPassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../utils/jwt';
import { AppError } from '../middleware/errorHandler';

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.deletedAt) throw new AppError('Invalid credentials', 401);
  if (!user.isActive) throw new AppError('Account is deactivated. Contact administrator.', 403);

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: refreshToken },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  };
}

export async function refreshAccessToken(token: string) {
  let payload: TokenPayload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.resetToken !== token) throw new AppError('Refresh token revoked', 401);
  if (!user.isActive) throw new AppError('Account deactivated', 403);

  const newPayload: TokenPayload = { userId: user.id, email: user.email, role: user.role };
  return { accessToken: generateAccessToken(newPayload) };
}

export async function logout(userId: string) {
  await prisma.user.update({ where: { id: userId }, data: { resetToken: null } });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.deletedAt) return;

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  console.log(`[DEV] Password reset link: /reset-password?token=${token}`);
  return token;
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetTokenExpiry: null },
  });
}
