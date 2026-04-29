import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export const BOOKING_SOURCES = ['SELF_BOOKING', 'BOOKING_COM', 'OTHER'] as const;
export type BookingSource = (typeof BOOKING_SOURCES)[number];

type CreateBookingData = {
  unitId: string;
  guestName: string;
  guestPhone?: string;
  bookingSource: BookingSource;
  bookingSourceOther?: string;
  startDate: Date;
  endDate: Date;
  dailyRate: number;
  discount?: number;
  notes?: string;
};

function calcDays(start: Date, end: Date): number {
  return Math.ceil(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export async function listBookings(
  page: number,
  limit: number,
  filters: { unitId?: string; dateFrom?: string; dateTo?: string; bookingSource?: string }
) {
  const where: Record<string, unknown> = {};
  if (filters.unitId) where.unitId = filters.unitId;
  if (filters.bookingSource) where.bookingSource = filters.bookingSource;
  if (filters.dateFrom || filters.dateTo) {
    where.startDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  const [bookings, total] = await Promise.all([
    prisma.airBnBBooking.findMany({
      where,
      include: {
        unit: { select: { unitNumber: true, property: { select: { name: true } } } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { startDate: 'desc' },
    }),
    prisma.airBnBBooking.count({ where }),
  ]);

  return { bookings, total };
}

export async function getBooking(id: string) {
  const booking = await prisma.airBnBBooking.findUnique({
    where: { id },
    include: { unit: { include: { property: true } } },
  });
  if (!booking) throw new AppError('Booking not found', 404);
  return booking;
}

export async function createBooking(data: CreateBookingData) {
  const unit = await prisma.unit.findFirst({ where: { id: data.unitId, deletedAt: null } });
  if (!unit) throw new AppError('Unit not found', 404);
  if (unit.unitType !== 'AIRBNB') throw new AppError('Bookings are only for AirBnB units', 400);

  if (!data.guestName?.trim()) throw new AppError('Guest name is required', 400);

  if (data.bookingSource === 'OTHER' && !data.bookingSourceOther?.trim()) {
    throw new AppError('Please specify the booking source', 400);
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (end <= start) throw new AppError('Check-out date must be after check-in date', 400);

  const overlap = await prisma.airBnBBooking.findFirst({
    where: { unitId: data.unitId, AND: [{ startDate: { lt: end } }, { endDate: { gt: start } }] },
  });
  if (overlap) throw new AppError('Booking dates overlap with an existing booking', 409);

  const days = calcDays(start, end);
  const discount = Number(data.discount ?? 0);
  const totalAmount = Number(data.dailyRate) * days - discount;

  return prisma.airBnBBooking.create({
    data: {
      unitId: data.unitId,
      guestName: data.guestName.trim(),
      guestPhone: data.guestPhone?.trim() || null,
      bookingSource: data.bookingSource,
      bookingSourceOther:
        data.bookingSource === 'OTHER' ? (data.bookingSourceOther?.trim() ?? null) : null,
      startDate: start,
      endDate: end,
      days,
      dailyRate: data.dailyRate,
      discount,
      totalAmount,
      notes: data.notes,
    },
    include: { unit: { select: { unitNumber: true, property: { select: { name: true } } } } },
  });
}

export async function updateBooking(id: string, data: Partial<CreateBookingData>) {
  const booking = await prisma.airBnBBooking.findUnique({ where: { id } });
  if (!booking) throw new AppError('Booking not found', 404);

  const start = data.startDate ? new Date(data.startDate) : booking.startDate;
  const end = data.endDate ? new Date(data.endDate) : booking.endDate;
  if (end <= start) throw new AppError('Check-out date must be after check-in date', 400);

  const days = calcDays(start, end);
  const dailyRate = Number(data.dailyRate ?? booking.dailyRate);
  const discount = Number(data.discount ?? booking.discount);
  const totalAmount = dailyRate * days - discount;

  const bookingSource = data.bookingSource ?? (booking.bookingSource as BookingSource);

  return prisma.airBnBBooking.update({
    where: { id },
    data: {
      ...data,
      guestName: data.guestName?.trim() ?? booking.guestName,
      guestPhone: data.guestPhone?.trim() || booking.guestPhone,
      bookingSource,
      bookingSourceOther:
        bookingSource === 'OTHER'
          ? (data.bookingSourceOther?.trim() ?? booking.bookingSourceOther)
          : null,
      startDate: start,
      endDate: end,
      days,
      dailyRate,
      discount,
      totalAmount,
    },
    include: { unit: { select: { unitNumber: true } } },
  });
}
