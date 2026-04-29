import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../lib/prisma';

type DateRange = { dateFrom?: string; dateTo?: string };

function dateFilter(range: DateRange) {
  if (!range.dateFrom && !range.dateTo) return undefined;
  return {
    ...(range.dateFrom ? { gte: new Date(range.dateFrom) } : {}),
    ...(range.dateTo ? { lte: new Date(range.dateTo) } : {}),
  };
}

function toNum(d: Decimal | number | null): number {
  return Number(d ?? 0);
}

// ─── Rental Report (RENT + SERVICE_CHARGE payments only) ─────────────────────

export async function rentalReport(filters: {
  propertyId?: string;
  unitId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const where: Record<string, unknown> = {
    paymentType: { in: ['RENT', 'SERVICE_CHARGE'] },
  };
  if (filters.propertyId) where.unit = { propertyId: filters.propertyId };
  if (filters.unitId) where.unitId = filters.unitId;
  const df = dateFilter(filters);
  if (df) where.paymentDate = df;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      tenant: { select: { firstName: true, lastName: true, phone: true } },
      unit: {
        select: {
          unitNumber: true,
          unitType: true,
          monthlyRent: true,
          serviceCharge: true,
          property: { select: { id: true, name: true } },
        },
      },
      recordedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { paymentDate: 'desc' },
  });

  const totalRent = payments
    .filter((p: { paymentType: string }) => p.paymentType === 'RENT')
    .reduce((s: number, p: { amount: Decimal | number | null }) => s + toNum(p.amount), 0);
  const totalServiceCharge = payments
    .filter((p: { paymentType: string }) => p.paymentType === 'SERVICE_CHARGE')
    .reduce((s: number, p: { amount: Decimal | number | null }) => s + toNum(p.amount), 0);

  return {
    summary: {
      totalRent,
      totalServiceCharge,
      grandTotal: totalRent + totalServiceCharge,
      paymentCount: payments.length,
    },
    payments,
  };
}

// ─── AirBnB Report ────────────────────────────────────────────────────────────

export async function airbnbReport(filters: {
  propertyId?: string;
  unitId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const df = dateFilter(filters);
  const where: Record<string, unknown> = {};
  if (filters.propertyId) where.unit = { propertyId: filters.propertyId };
  if (filters.unitId) where.unitId = filters.unitId;
  if (df) where.startDate = df;

  const bookings = await prisma.airBnBBooking.findMany({
    where,
    include: {
      tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
      unit: {
        select: {
          unitNumber: true,
          dailyRate: true,
          property: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  const totalRevenue = bookings.reduce((s: number, b: { totalAmount: Decimal | number | null }) => s + toNum(b.totalAmount), 0);
  const totalNights = bookings.reduce((s: number, b: { days: number }) => s + b.days, 0);
  const totalDiscount = bookings.reduce((s: number, b: { discount: Decimal | number | null }) => s + toNum(b.discount), 0);

  return {
    summary: {
      bookingCount: bookings.length,
      totalNights,
      totalDiscount,
      totalRevenue,
    },
    bookings,
  };
}

// ─── Upcoming Rent Collections (next 45 days) ─────────────────────────────────

export async function upcomingCollections(days = 45) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);

  // All active assignments on non-AirBnB units
  const assignments = await prisma.tenantAssignment.findMany({
    where: {
      isActive: true,
      unit: { unitType: { not: 'AIRBNB' }, deletedAt: null },
    },
    include: {
      tenant: { select: { id: true, firstName: true, lastName: true, phone: true } },
      unit: {
        select: {
          id: true,
          unitNumber: true,
          monthlyRent: true,
          serviceCharge: true,
          property: { select: { id: true, name: true } },
        },
      },
    },
  });

  const results = await Promise.all(
    assignments.map(async (assignment: any) => {
      const latestPayment = await prisma.payment.findFirst({
        where: {
          tenantId: assignment.tenantId,
          unitId: assignment.unitId,
          paymentType: 'RENT',
        },
        orderBy: { periodEnd: 'desc' },
        select: { periodEnd: true, periodStart: true, amount: true, paymentDate: true },
      });

      // If never paid, treat check-in date as the period end baseline
      const periodEnd: Date = latestPayment?.periodEnd ?? assignment.checkInDate;
      const daysRemaining = Math.ceil((periodEnd.getTime() - today.getTime()) / 86400000);
      const isOverdue = daysRemaining < 0;
      const isDueWithin45Days = periodEnd <= cutoff;

      if (!isDueWithin45Days) return null;

      return {
        assignmentId: assignment.id,
        tenant: assignment.tenant,
        unit: assignment.unit,
        checkInDate: assignment.checkInDate,
        lastPaidPeriodEnd: latestPayment?.periodEnd ?? null,
        lastPaymentDate: latestPayment?.paymentDate ?? null,
        lastPaymentAmount: latestPayment ? toNum(latestPayment.amount) : null,
        expectedRent: toNum(assignment.unit.monthlyRent),
        daysRemaining,
        isOverdue,
        hasNeverPaid: !latestPayment,
        status: isOverdue ? 'OVERDUE' : daysRemaining <= 7 ? 'DUE_SOON' : 'UPCOMING',
      };
    })
  );

  const filtered = results.filter(Boolean) as NonNullable<(typeof results)[number]>[];
  filtered.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const overdue = filtered.filter((r) => r.isOverdue).length;
  const dueSoon = filtered.filter((r) => !r.isOverdue && r.daysRemaining <= 7).length;
  const upcoming = filtered.filter((r) => r.daysRemaining > 7).length;

  return {
    summary: { total: filtered.length, overdue, dueSoon, upcoming },
    collections: filtered,
  };
}

// ─── Occupancy Report ─────────────────────────────────────────────────────────

export async function occupancyReport(filters: { propertyId?: string }) {
  const units = await prisma.unit.findMany({
    where: {
      deletedAt: null,
      ...(filters.propertyId ? { propertyId: filters.propertyId } : {}),
    },
    include: {
      property: { select: { id: true, name: true, location: true } },
      assignments: {
        where: { isActive: true },
        include: { tenant: { select: { firstName: true, lastName: true, phone: true } } },
      },
    },
    orderBy: [{ property: { name: 'asc' } }, { unitNumber: 'asc' }],
  });

  const occupied = units.filter((u: any) => u.assignments.length > 0).length;
  const vacant = units.length - occupied;
  const occupancyRate = units.length > 0 ? Math.round((occupied / units.length) * 100) : 0;

  return {
    summary: { total: units.length, occupied, vacant, occupancyRate },
    units: units.map((u: any) => ({
      ...u,
      status: u.assignments.length > 0 ? 'OCCUPIED' : 'VACANT',
      currentTenant: u.assignments[0]?.tenant ?? null,
      checkInDate: u.assignments[0]?.checkInDate ?? null,
    })),
  };
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function auditReport(filters: { userId?: string; entity?: string; page: number; limit: number }) {
  const where: Record<string, unknown> = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.entity) where.entity = filters.entity;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function dashboardStats() {
  const [totalProperties, totalUnits, occupiedUnits, totalTenants, payments, bookings] =
    await Promise.all([
      prisma.property.count({ where: { deletedAt: null } }),
      prisma.unit.count({ where: { deletedAt: null } }),
      prisma.tenantAssignment.count({ where: { isActive: true } }),
      prisma.tenant.count({ where: { deletedAt: null } }),
      prisma.payment.findMany({ select: { amount: true, paymentType: true, paymentDate: true } }),
      prisma.airBnBBooking.findMany({ select: { totalAmount: true, startDate: true } }),
    ]);

  const totalRevenue =
    payments.reduce((s: number, p: { amount: Decimal | number | null }) => s + toNum(p.amount), 0) +
    bookings.reduce((s: number, b: { totalAmount: Decimal | number | null }) => s + toNum(b.totalAmount), 0);

  const vacantUnits = totalUnits - occupiedUnits;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  // Monthly income — last 6 months
  const now = new Date();
  const monthlyIncome: { month: string; rent: number; serviceCharge: number; airbnb: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

    const mp = payments.filter((p: { paymentDate: Date }) => p.paymentDate >= monthStart && p.paymentDate <= monthEnd);
    const mb = bookings.filter((b: { startDate: Date }) => b.startDate >= monthStart && b.startDate <= monthEnd);

    monthlyIncome.push({
      month: label,
      rent: mp.filter((p: { paymentType: string; amount: Decimal | number | null }) => p.paymentType === 'RENT').reduce((s: number, p: { amount: Decimal | number | null }) => s + toNum(p.amount), 0),
      serviceCharge: mp.filter((p: { paymentType: string; amount: Decimal | number | null }) => p.paymentType === 'SERVICE_CHARGE').reduce((s: number, p: { amount: Decimal | number | null }) => s + toNum(p.amount), 0),
      airbnb: mb.reduce((s: number, b: { totalAmount: Decimal | number | null }) => s + toNum(b.totalAmount), 0),
    });
  }

  // Upcoming collections count for dashboard badge
  const upcoming = await upcomingCollections(45);

  return {
    totalProperties,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    occupancyRate,
    totalTenants,
    totalRevenue,
    monthlyIncome,
    upcomingCollections: upcoming.summary,
  };
}
