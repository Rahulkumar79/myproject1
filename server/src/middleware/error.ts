import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function asyncHandler(
  fn: (req: any, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  let statusCode = err instanceof AppError ? err.statusCode : err.status || err.statusCode || 500;
  let message = 'An unexpected server error occurred. Please try again.';

  if (err instanceof AppError) {
    message = err.message;
  } else if (err?.code === 'LIMIT_FILE_SIZE' || err?.type === 'entity.too.large' || statusCode === 413) {
    statusCode = 413;
    message = 'Uploaded file or request payload exceeds the maximum allowed size limit (10MB for documents).';
  } else if (err?.code === 'LIMIT_FILE_COUNT' || err?.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Invalid file upload request. Please upload a single valid study document.';
  } else if (err?.message && statusCode < 500) {
    message = err.message;
  }

  if (statusCode >= 500) {
    const safeErrMsg = String(err?.message || 'Internal error').slice(0, 180);
    console.error(`[Server Error] status=${statusCode} msg="${safeErrMsg}"`);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
