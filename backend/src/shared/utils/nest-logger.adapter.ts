import { LoggerService, Logger } from '@nestjs/common';
import pino from 'pino';

export class PinoLoggerAdapter implements LoggerService {
  private logger: pino.Logger;

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: { pid: process.pid },
    });
  }

  log(message: string, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.info({ ...meta, context }, message);
  }

  error(message: string, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    const trace = optionalParams.pop();
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.error({ ...meta, context, trace }, message);
  }

  warn(message: string, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.warn({ ...meta, context }, message);
  }

  debug(message: string, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.debug({ ...meta, context }, message);
  }

  verbose(message: string, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.trace({ ...meta, context }, message);
  }

  getPinoLogger(): pino.Logger {
    return this.logger;
  }
}

let globalPinoLogger: PinoLoggerAdapter;

export function getPinoAdapter(): PinoLoggerAdapter {
  if (!globalPinoLogger) {
    globalPinoLogger = new PinoLoggerAdapter();
  }
  return globalPinoLogger;
}
