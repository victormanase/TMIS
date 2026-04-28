import { Response } from 'express';

export function success(res: Response, data: unknown, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

export function created(res: Response, data: unknown, message = 'Created') {
  return success(res, data, message, 201);
}

export function paginated(
  res: Response,
  data: unknown[],
  total: number,
  page: number,
  limit: number,
  message = 'Success'
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}
