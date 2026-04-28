import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export async function listTenants(page: number, limit: number, search?: string) {
  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        assignments: {
          where: { isActive: true },
          include: { unit: { include: { property: { select: { name: true } } } } },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tenant.count({ where }),
  ]);

  return { tenants, total };
}

export async function getTenant(id: string) {
  const tenant = await prisma.tenant.findFirst({
    where: { id, deletedAt: null },
    include: {
      assignments: {
        include: {
          unit: { include: { property: { select: { id: true, name: true } } } },
        },
        orderBy: { checkInDate: 'desc' },
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
        include: {
          unit: { select: { unitNumber: true, property: { select: { name: true } } } },
          recordedBy: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
  if (!tenant) throw new AppError('Tenant not found', 404);
  return tenant;
}

export async function createTenant(data: {
  firstName: string;
  middleName?: string;
  lastName: string;
  phone: string;
}) {
  return prisma.tenant.create({ data });
}

export async function updateTenant(
  id: string,
  data: Partial<{
    firstName: string;
    middleName: string;
    lastName: string;
    phone: string;
  }>
) {
  const tenant = await prisma.tenant.findFirst({ where: { id, deletedAt: null } });
  if (!tenant) throw new AppError('Tenant not found', 404);
  return prisma.tenant.update({ where: { id }, data });
}

export async function deleteTenant(id: string) {
  const tenant = await prisma.tenant.findFirst({ where: { id, deletedAt: null } });
  if (!tenant) throw new AppError('Tenant not found', 404);
  await prisma.tenant.update({ where: { id }, data: { deletedAt: new Date() } });
}
