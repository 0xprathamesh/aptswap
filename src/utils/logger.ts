import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`[${logLevel}] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  
  next();
};

export const logger = {
  info: (message: string, meta?: any): void => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  
  error: (message: string, error?: any): void => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  
  warn: (message: string, meta?: any): void => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  },
  
  debug: (message: string, meta?: any): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  }
};

export const logTransaction = (txHash: string, chainId: number, action: string, status: 'pending' | 'success' | 'failed'): void => {
  logger.info(`Transaction ${action}`, {
    txHash,
    chainId,
    status,
    timestamp: new Date().toISOString()
  });
};

export const logSwapEvent = (orderId: string, event: string, details?: any): void => {
  logger.info(`Swap event: ${event}`, {
    orderId,
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logError = (context: string, error: any, meta?: any): void => {
  logger.error(`Error in ${context}`, {
    error: error.message,
    stack: error.stack,
    meta,
    timestamp: new Date().toISOString()
  });
}; 