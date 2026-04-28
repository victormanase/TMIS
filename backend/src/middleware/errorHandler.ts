import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public errors?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  // Prisma unique constraint
  if ((err as any).code === 'P2002') {
    res.status(409).json({ success: false, message: 'A record with that value already exists.' });
    return;
  }

  // Prisma not found
  if ((err as any).code === 'P2025') {
    res.status(404).json({ success: false, message: 'Record not found.' });
    return;
  }

  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
}
