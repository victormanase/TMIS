import { UnitType } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

type CreateUnitData = {
  propertyId: string;
  unitNumber: string;
  unitType: UnitType;
  bedrooms: number;
  monthlyRent?: number;
  dailyRate?: number;
  serviceCharge: number;
};

function validateUnitRates(data: Partial<CreateUnitData>) {
  if (data.unitType === 'AIRBNB') {
    if (!data.dailyRate) throw new AppError('Daily rate is required for AirBnB units', 400);
  } else if (data.unitType) {
    if (!data.monthlyRent) throw new AppError('Monthly rent is required for non-AirBnB units', 400);
  }
}

export async function listUnits(
  page: number,
  limit: number,
  filters: { propertyId?: string; unitType?: UnitType; search?: string }
) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.propertyId) where.propertyId = filters.propertyId;
  if (filters.unitType) where.unitType = filters.unitType;
  if (filters.search) {
    where.unitNumber = { contains: filters.search, mode: 'insensitive' };
  }

  const [units, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, location: true } },
        assignments: { where: { isActive: true }, include: { tenant: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ property: { name: 'asc' } }, { unitNumber: 'asc' }],
    }),
    prisma.unit.count({ where }),
  ]);

  return { units, total };
}

export async function getUnit(id: string) {
  const unit = await prisma.unit.findFirst({
    where: { id, deletedAt: null },
    include: {
      property: true,
      assignments: {
        include: { tenant: true },
        orderBy: { checkInDate: 'desc' },
      },
      payments: {
        orderBy: { paymentDate: 'desc' },
        take: 20,
        include: { tenant: true, recordedBy: { select: { firstName: true, lastName: true } } },
      },
    },
  });
  if (!unit) throw new AppError('Unit not found', 404);
  return unit;
}

export async function createUnit(data: CreateUnitData) {
  validateUnitRates(data);
  return prisma.unit.create({
    data: {
      propertyId: data.propertyId,
      unitNumber: data.unitNumber,
      unitType: data.unitType,
      bedrooms: data.bedrooms,
      monthlyRent: data.monthlyRent ?? null,
      dailyRate: data.dailyRate ?? null,
      serviceCharge: data.serviceCharge,
    },
    include: { property: { select: { id: true, name: true } } },
  });
}

export async function updateUnit(id: string, data: Partial<CreateUnitData>) {
  const unit = await prisma.unit.findFirst({ where: { id, deletedAt: null } });
  if (!unit) throw new AppError('Unit not found', 404);
  validateUnitRates({ ...unit, ...data } as Partial<CreateUnitData>);

  return prisma.unit.update({
    where: { id },
    data,
    include: { property: { select: { id: true, name: true } } },
  });
}

export async function deleteUnit(id: string) {
  const unit = await prisma.unit.findFirst({ where: { id, deletedAt: null } });
  if (!unit) throw new AppError('Unit not found', 404);
  await prisma.unit.update({ where: { id }, data: { deletedAt: new Date() } });
}
