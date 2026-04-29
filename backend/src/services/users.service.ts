type Role = 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'VIEWER';
import prisma from '../lib/prisma';
import { hashPassword } from '../utils/password';
import { AppError } from '../middleware/errorHandler';

const SELECT_USER = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export async function listUsers(page: number, limit: number, search?: string) {
  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: SELECT_USER,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function getUser(id: string) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: SELECT_USER });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function createUser(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
}) {
  const hashed = await hashPassword(data.password);
  return prisma.user.create({
    data: { ...data, password: hashed },
    select: SELECT_USER,
  });
}

export async function updateUser(
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: Role;
    password: string;
  }>
) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new AppError('User not found', 404);

  const updateData: Record<string, unknown> = { ...data };
  if (data.password) updateData.password = await hashPassword(data.password);

  return prisma.user.update({ where: { id }, data: updateData, select: SELECT_USER });
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new AppError('User not found', 404);
  await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function toggleActive(id: string) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw new AppError('User not found', 404);
  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: SELECT_USER,
  });
}
