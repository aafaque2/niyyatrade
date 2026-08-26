import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; ver?: number }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, tokenVersion: true },
    });

    // Deleted users and tokens issued before a credential change
    // (password change/reset bumps tokenVersion) are rejected immediately.
    if (
      !user ||
      (payload.ver !== undefined && payload.ver !== user.tokenVersion)
    ) {
      throw new UnauthorizedException('Session is no longer valid');
    }

    return { sub: user.id, email: user.email };
  }
}
