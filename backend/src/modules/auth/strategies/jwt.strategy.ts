import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

function parseCookie(
  header: string | string[] | undefined,
): Record<string, string> {
  if (typeof header !== 'string' || header.length === 0) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name && !(name in out)) {
      try {
        out[name] = decodeURIComponent(value);
      } catch {
        out[name] = value;
      }
    }
  }
  return out;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // httpOnly session cookie first (XSS-safe), Bearer header as fallback
      // for older clients that still keep the token in localStorage.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: {
          cookies?: Record<string, string>;
          headers: Record<string, string | string[] | undefined>;
        }) => {
          const fromCookie =
            req?.cookies?.['nt_auth'] ??
            parseCookie(req?.headers?.cookie)['nt_auth'];
          if (typeof fromCookie === 'string' && fromCookie.length > 0) {
            return fromCookie;
          }
          return null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
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
