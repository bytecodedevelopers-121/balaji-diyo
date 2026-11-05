import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { ApiError } from '../exceptions/api-error';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let message = 'Internal Server Error';
  let fieldErrors: { field: string; message: string }[] | undefined;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    fieldErrors = err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }));
  } else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof MulterError) {
    // Every upload route's multer instance throws this as a plain Error
    // subclass (no statusCode/status of its own) — left unhandled it fell
    // through to the generic 500 branch below, surfacing an oversized file
    // as an opaque server error instead of a clean 400.
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
  } else if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Duplicate field value entered';
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  } else if (err.code?.startsWith('P')) {
    statusCode = 400;
    message = err.message || 'Database error';
  } else if (err.statusCode || err.status) {
    statusCode = err.statusCode || err.status;
    message = err.message || message;
  }

  // Expected client errors (e.g. a 404 for a category slug the site probes and
  // handles itself) are already reported by the request log line, so only
  // unexpected errors print a stack trace.
  const isExpectedClientError = err instanceof ApiError && err.isOperational && statusCode < 500;
  if (process.env.NODE_ENV === 'development' && !isExpectedClientError) {
    console.error('Error:', err);
  }

  // consistent shape with ApiResponseDto
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    data: null,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] ?? null,
    ...(fieldErrors && { errors: fieldErrors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};