import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export async function listProperties(page: number, limit: number, search?: string) {
  const where = {
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: { _count: { select: { units: { where: { deletedAt: null } } } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.property.count({ where }),
  ]);

  return { properties, total };
}

export async function getProperty(id: string) {
  const property = await prisma.property.findFirst({
    where: { id, deletedAt: null },
    include: {
      units: {
        where: { deletedAt: null },
        include: {
          assignments: { where: { isActive: true }, include: { tenant: true } },
          _count: { select: { payments: true } },
        },
      },
    },
  });
  if (!property) throw new AppError('Property not found', 404);
  return property;
}

export async function createProperty(data: {
  name: string;
  location: string;
  description?: string;
}) {
  return prisma.property.create({ data });
}

export async function updateProperty(
  id: string,
  data: Partial<{ name: string; location: string; description: string }>
) {
  const prop = await prisma.property.findFirst({ where: { id, deletedAt: null } });
  if (!prop) throw new AppError('Property not found', 404);
  return prisma.property.update({ where: { id }, data });
}

export async function deleteProperty(id: string) {
  const prop = await prisma.property.findFirst({ where: { id, deletedAt: null } });
  if (!prop) throw new AppError('Property not found', 404);
  await prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
}
