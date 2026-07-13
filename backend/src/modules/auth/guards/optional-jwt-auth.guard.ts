import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: Error | null, user: TUser | false): TUser | undefined {
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}
