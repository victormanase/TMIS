import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export async function assignTenant(data: {
  unitId: string;
  tenantId: string;
  checkInDate: Date;
}) {
  const unit = await prisma.unit.findFirst({ where: { id: data.unitId, deletedAt: null } });
  if (!unit) throw new AppError('Unit not found', 404);

  const tenant = await prisma.tenant.findFirst({ where: { id: data.tenantId, deletedAt: null } });
  if (!tenant) throw new AppError('Tenant not found', 404);

  if (unit.unitType !== 'AIRBNB') {
    const existing = await prisma.tenantAssignment.findFirst({
      where: { unitId: data.unitId, isActive: true },
    });
    if (existing) {
      throw new AppError('Unit already has an active tenant. Check out the current tenant first.', 400);
    }
  }

  return prisma.tenantAssignment.create({
    data: {
      unitId: data.unitId,
      tenantId: data.tenantId,
      checkInDate: new Date(data.checkInDate),
      isActive: true,
    },
    include: {
      unit: { select: { unitNumber: true } },
      tenant: true,
    },
  });
}

export async function getAssignmentsByUnit(unitId: string) {
  return prisma.tenantAssignment.findMany({
    where: { unitId },
    include: { tenant: true },
    orderBy: { checkInDate: 'desc' },
  });
}

export async function checkoutTenant(assignmentId: string) {
  const assignment = await prisma.tenantAssignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new AppError('Assignment not found', 404);
  if (!assignment.isActive) throw new AppError('Tenant already checked out', 400);

  return prisma.tenantAssignment.update({
    where: { id: assignmentId },
    data: { checkOutDate: new Date(), isActive: false },
    include: { tenant: true, unit: { select: { unitNumber: true } } },
  });
}
