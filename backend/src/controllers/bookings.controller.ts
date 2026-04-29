import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as bookingsService from '../services/bookings.service';
import { success, created, paginated } from '../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { bookings, total } = await bookingsService.listBookings(page, limit, {
      unitId: req.query.unitId as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      bookingSource: req.query.bookingSource as string | undefined,
    });
    paginated(res, bookings, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await bookingsService.getBooking(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    created(res, await bookingsService.createBooking(req.body), 'Booking created');
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await bookingsService.updateBooking(String(req.params.id), req.body));
  } catch (err) {
    next(err);
  }
}
