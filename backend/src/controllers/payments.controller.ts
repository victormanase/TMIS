import { Response, NextFunction } from 'express';
import { PaymentType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import * as paymentsService from '../services/payments.service';
import { success, created, paginated } from '../utils/response';

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const { payments, total } = await paymentsService.listPayments(page, limit, {
      tenantId: req.query.tenantId as string | undefined,
      unitId: req.query.unitId as string | undefined,
      propertyId: req.query.propertyId as string | undefined,
      paymentType: req.query.paymentType as PaymentType | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
    });
    paginated(res, payments, total, page, limit);
  } catch (err) {
    next(err);
  }
}

export async function get(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await paymentsService.getPayment(String(req.params.id)));
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const payment = await paymentsService.createPayment({
      ...req.body,
      recordedById: req.user!.userId,
    });
    created(res, payment, 'Payment recorded');
  } catch (err) {
    next(err);
  }
}

export async function tenantLedger(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    success(res, await paymentsService.getTenantLedger(String(req.params.tenantId)));
  } catch (err) {
    next(err);
  }
}
