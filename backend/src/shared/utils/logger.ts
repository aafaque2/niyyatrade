import { Injectable } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class Logger {
  private logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty' }
          : undefined,
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  info(message: string, ...args: unknown[]) {
    this.logger.info(args.length ? { args } : undefined, message);
  }

  warn(message: string, ...args: unknown[]) {
    this.logger.warn(args.length ? { args } : undefined, message);
  }

  error(message: string, ...args: unknown[]) {
    this.logger.error(args.length ? { args } : undefined, message);
  }

  debug(message: string, ...args: unknown[]) {
    this.logger.debug(args.length ? { args } : undefined, message);
  }
}
