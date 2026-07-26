import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { getPinoAdapter } from '../shared/utils/nest-logger.adapter';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = getPinoAdapter().getPinoLogger();

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, url } = req;
    const requestId = req.headers['x-request-id'] as string;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const log = {
        method,
        url,
        status: res.statusCode,
        duration,
        requestId,
      };

      if (res.statusCode >= 500) {
        this.logger.error(log, `${method} ${url} ${res.statusCode} ${duration}ms`);
      } else if (res.statusCode >= 400) {
        this.logger.warn(log, `${method} ${url} ${res.statusCode} ${duration}ms`);
      } else {
        this.logger.info(log, `${method} ${url} ${res.statusCode} ${duration}ms`);
      }
    });

    next();
  }
}
