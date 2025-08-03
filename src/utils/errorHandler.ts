import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new CustomError(message, 404);
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = new CustomError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = new CustomError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new CustomError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new CustomError(message, 401);
  }

  // Ethers.js errors
  if (err.message?.includes('insufficient funds')) {
    const message = 'Insufficient funds for transaction';
    error = new CustomError(message, 400);
  }

  if (err.message?.includes('nonce too low')) {
    const message = 'Transaction nonce too low';
    error = new CustomError(message, 400);
  }

  if (err.message?.includes('gas required exceeds allowance')) {
    const message = 'Insufficient gas for transaction';
    error = new CustomError(message, 400);
  }

  // Aptos errors
  if (err.message?.includes('INSUFFICIENT_BALANCE')) {
    const message = 'Insufficient balance for transaction';
    error = new CustomError(message, 400);
  }

  if (err.message?.includes('SEQUENCE_NUMBER_TOO_OLD')) {
    const message = 'Transaction sequence number too old';
    error = new CustomError(message, 400);
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const createError = (message: string, statusCode: number = 500): CustomError => {
  return new CustomError(message, statusCode);
}; 