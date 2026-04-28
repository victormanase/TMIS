import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as reportsService from '../services/reports.service';
import { success, paginated } from '../utils/response';
import { exportRentalPdf, exportAirbnbPdf, exportOccupancyPdf } from '../utils/exportPdf';
import { exportRentalExcel, exportAirbnbExcel, exportOccupancyExcel } from '../utils/exportExcel';

export async function rental(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await reportsService.rentalReport({
      propertyId: req.query.propertyId as string,
      unitId: req.query.unitId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    }));
  } catch (err) { next(err); }
}

export async function airbnb(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await reportsService.airbnbReport({
      propertyId: req.query.propertyId as string,
      unitId: req.query.unitId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    }));
  } catch (err) { next(err); }
}

export async function upcomingCollections(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const days = Number(req.query.days) || 45;
    success(res, await reportsService.upcomingCollections(days));
  } catch (err) { next(err); }
}

export async function occupancy(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await reportsService.occupancyReport({ propertyId: req.query.propertyId as string }));
  } catch (err) { next(err); }
}

export async function dashboard(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await reportsService.dashboardStats());
  } catch (err) { next(err); }
}

export async function auditLogs(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const { logs, total } = await reportsService.auditReport({
      userId: req.query.userId as string,
      entity: req.query.entity as string,
      page, limit,
    });
    paginated(res, logs, total, page, limit);
  } catch (err) { next(err); }
}

export async function exportReport(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const format = (req.query.format as string) ?? 'pdf';
    const type = (req.query.type as string) ?? 'rental';
    const filters = {
      propertyId: req.query.propertyId as string,
      unitId: req.query.unitId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
    };

    if (type === 'rental') {
      const result = await reportsService.rentalReport(filters);
      if (format === 'excel') {
        await exportRentalExcel(res, result.summary, result.payments as any);
      } else {
        exportRentalPdf(res, result.summary, result.payments as any, filters);
      }
      return;
    }

    if (type === 'airbnb') {
      const result = await reportsService.airbnbReport(filters);
      if (format === 'excel') {
        await exportAirbnbExcel(res, result.summary, result.bookings as any);
      } else {
        exportAirbnbPdf(res, result.summary, result.bookings as any, filters);
      }
      return;
    }

    if (type === 'occupancy') {
      const result = await reportsService.occupancyReport({ propertyId: filters.propertyId });
      if (format === 'excel') {
        await exportOccupancyExcel(res, result.summary, result.units as any);
      } else {
        exportOccupancyPdf(res, result.summary, result.units as any);
      }
      return;
    }

    res.status(400).json({ success: false, message: 'Invalid report type. Use: rental, airbnb, occupancy' });
  } catch (err) { next(err); }
}
