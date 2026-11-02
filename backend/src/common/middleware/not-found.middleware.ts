import { Request, Response } from 'express';

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    data: null,
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'] ?? null,
  });
};  