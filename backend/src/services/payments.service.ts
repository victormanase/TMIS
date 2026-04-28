import { PaymentType } from '@prisma/client';
import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

type CreatePaymentData = {
  tenantId: string;
  unitId: string;
  paymentType: PaymentType;
  amount: number;
  paymentDate: Date;
  periodStart: Date;
  periodEnd: Date;
  recordedById: string;
  notes?: string;
};

type ListFilters = {
  tenantId?: string;
  unitId?: string;
  propertyId?: string;
  paymentType?: PaymentType;
  dateFrom?: string;
  dateTo?: string;
};

export async function listPayments(page: number, limit: number, filters: ListFilters) {
  const where: Record<string, unknown> = {};

  if (filters.tenantId) where.tenantId = filters.tenantId;
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.paymentType) where.paymentType = filters.paymentType;
  if (filters.propertyId) where.unit = { propertyId: filters.propertyId };

  if (filters.dateFrom || filters.dateTo) {
    where.paymentDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        tenant: { select: { id: true, firstName: true, lastName: true } },
        unit: {
          select: {
            id: true,
            unitNumber: true,
            property: { select: { id: true, name: true } },
          },
        },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  return { payments, total };
}

export async function getPayment(id: string) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      tenant: true,
      unit: { include: { property: true } },
      recordedBy: { select: { firstName: true, lastName: true } },
    },
  });
  if (!payment) throw new AppError('Payment not found', 404);
  return payment;
}

export async function createPayment(data: CreatePaymentData) {
  const unit = await prisma.unit.findFirst({ where: { id: data.unitId, deletedAt: null } });
  if (!unit) throw new AppError('Unit not found', 404);

  const tenant = await prisma.tenant.findFirst({ where: { id: data.tenantId, deletedAt: null } });
  if (!tenant) throw new AppError('Tenant not found', 404);

  return prisma.payment.create({
    data: {
      tenantId: data.tenantId,
      unitId: data.unitId,
      paymentType: data.paymentType,
      amount: data.amount,
      paymentDate: new Date(data.paymentDate),
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      recordedById: data.recordedById,
      notes: data.notes,
    },
    include: {
      tenant: { select: { firstName: true, lastName: true } },
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
      recordedBy: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function getTenantLedger(tenantId: string) {
  const tenant = await prisma.tenant.findFirst({ where: { id: tenantId, deletedAt: null } });
  if (!tenant) throw new AppError('Tenant not found', 404);

  const payments = await prisma.payment.findMany({
    where: { tenantId },
    include: {
      unit: { select: { unitNumber: true, property: { select: { name: true } } } },
      recordedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return { tenant, payments, total };
}
