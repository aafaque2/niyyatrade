import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import * as Sentry from '@sentry/nestjs';

interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred.';
    let details: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
      } else if (typeof responseBody === 'object') {
        const obj = responseBody as Record<string, unknown>;
        message = (obj.message as string) || message;
        code = (obj.code as string) || this.getCodeFromStatus(status);
        if (obj.details) {
          details = obj.details as Record<string, unknown>;
        }
        if (Array.isArray(obj.message)) {
          details = { errors: obj.message };
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof Error) {
      // Never leak internal error details (Prisma, providers, etc.) to clients.
      // The real message is logged below and captured in Sentry.
      message = 'An unexpected error occurred.';
      try {
        Sentry.captureException(exception);
      } catch {
        // Sentry not initialized
      }
    }

    const requestId = (request.headers['x-request-id'] as string) || 'unknown';

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} ${code}: ${describeException(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} ${status} ${code}: ${message}`,
      );
    }

    const errorResponse: ErrorResponse = {
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    // The client may have disconnected (navigation, crawl, timeout) — writing
    // to a dead socket throws, which would bounce us into Nest's fallback
    // ExceptionHandler and produce useless "msg": {} logs.
    try {
      if (!response.headersSent) {
        response.status(status).json(errorResponse);
      }
    } catch {
      this.logger.warn(
        `Could not deliver error response for ${request.method} ${request.url} — client likely disconnected`,
      );
    }
  }

  private getCodeFromStatus(statusCode: number): string {
    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMIT_EXCEEDED',
    };
    return statusMap[statusCode] ?? 'INTERNAL_SERVER_ERROR';
  }
}

/**
 * Extract a useful description from any thrown value — exceptions that are
 * not Error instances (strings, plain objects, undefined) previously logged
 * as "unknown", hiding the actual failure.
 */
function describeException(exception: unknown): string {
  if (exception instanceof Error) {
    return exception.message || exception.name || 'Error with no message';
  }
  if (typeof exception === 'string') return exception;
  if (exception && typeof exception === 'object') {
    const maybe = exception as Record<string, unknown>;
    if (typeof maybe['message'] === 'string') return maybe['message'];
    try {
      return JSON.stringify(exception);
    } catch {
      return Object.prototype.toString.call(exception);
    }
  }
  switch (typeof exception) {
    case 'number':
    case 'boolean':
    case 'bigint':
      return exception.toString();
    default:
      return 'unknown';
  }
}
