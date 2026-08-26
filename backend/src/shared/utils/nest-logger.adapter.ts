import { LoggerService } from '@nestjs/common';
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

  /**
   * Nest's internal ExceptionHandler passes raw exception objects (not
   * strings) to logger.error — e.g. when an exception filter itself throws.
   * Coerce anything we receive into a useful string instead of letting pino
   * serialize an Error as "msg": {}.
   */
  private static toMessage(message: unknown): string {
    if (typeof message === 'string') return message;
    if (message instanceof Error) {
      return message.message || message.name || 'Unknown error';
    }
    if (message && typeof message === 'object') {
      const maybe = message as Record<string, unknown>;
      if (typeof maybe['message'] === 'string') return maybe['message'];
      try {
        return JSON.stringify(message);
      } catch {
        return Object.prototype.toString.call(message);
      }
    }
    switch (typeof message) {
      case 'number':
      case 'boolean':
      case 'bigint':
        return message.toString();
      default:
        return 'unknown';
    }
  }

  log(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.info(
      { ...meta, context },
      PinoLoggerAdapter.toMessage(message),
    );
  }

  error(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    let trace = optionalParams.pop();
    // Nest sometimes passes (exception-object, stack) — pull the stack out of
    // the object itself if no explicit trace was given.
    if (!trace && message instanceof Error) {
      trace = message.stack;
    }
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.error(
      { ...meta, context, trace },
      PinoLoggerAdapter.toMessage(message),
    );
  }

  warn(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.warn(
      { ...meta, context },
      PinoLoggerAdapter.toMessage(message),
    );
  }

  debug(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.debug(
      { ...meta, context },
      PinoLoggerAdapter.toMessage(message),
    );
  }

  verbose(message: unknown, ...optionalParams: unknown[]) {
    const context = optionalParams.pop();
    const meta = optionalParams.length > 0 ? { data: optionalParams } : {};
    this.logger.trace(
      { ...meta, context },
      PinoLoggerAdapter.toMessage(message),
    );
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
