import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Only permit safe characters so a malicious client cannot forge log lines via
// newline/control-character injection into X-Request-ID.
const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,64}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const existing = req.headers['x-request-id'];
    const safe =
      typeof existing === 'string' && SAFE_REQUEST_ID.test(existing)
        ? existing
        : randomUUID();
    req.headers['x-request-id'] = safe;
    next();
  }
}
