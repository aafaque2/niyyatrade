import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID, createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  DEFAULT_CURRENCY,
  getStartingBalance,
} from '../../shared/constants/currency';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name ?? null,
        passwordHash,
        portfolio: {
          create: {
            availableCashCents: getStartingBalance(DEFAULT_CURRENCY),
          },
        },
      },
      include: { portfolio: true },
    });

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      ver: user.tokenVersion,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        activeFrameworkId: user.activeFrameworkId,
        currency: (user as Record<string, unknown>).currency ?? 'USD',
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      ver: user.tokenVersion,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        activeFrameworkId: user.activeFrameworkId,
        currency: (user as Record<string, unknown>).currency ?? 'USD',
      },
      token,
    };
  }

  /**
   * Always resolves with a generic message — whether or not the email exists —
   * so the endpoint cannot be used to enumerate registered accounts.
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const genericMessage = {
      message:
        'If an account exists for that email, a password reset link has been sent.',
    };

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true },
    });

    if (!user || !this.mail.isConfigured) {
      if (user && !this.mail.isConfigured) {
        this.logger.warn(
          `Password reset requested for ${email} but RESEND_API_KEY is not configured`,
        );
      }
      return genericMessage;
    }

    // Invalidate any previous outstanding reset tokens for this user.
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.mail.send({
        to: email,
        subject: 'Reset your NiyyaTrade password',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #111827;">Password reset</h2>
            <p style="color: #374151; font-size: 14px; line-height: 1.6;">
              Hi${user.name ? ` ${user.name}` : ''}, we received a request to reset your NiyyaTrade password.
              Click the button below to choose a new one. This link expires in 15 minutes.
            </p>
            <p style="margin: 24px 0;">
              <a href="${resetLink}"
                 style="background-color: #059669; color: #ffffff; padding: 10px 20px;
                        border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
                Reset password
              </a>
            </p>
            <p style="color: #6b7280; font-size: 12px; line-height: 1.5;">
              If you didn't request this, you can safely ignore this email —
              your password will stay unchanged.
            </p>
          </div>
        `,
      });
    } catch (err) {
      // Don't surface mail failures to the client (still anti-enumeration).
      this.logger.error(
        `Failed to send reset email to ${email}: ${(err as Error).message}`,
      );
    }

    return genericMessage;
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'This password reset link is invalid or has expired. Please request a new one.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Mark the token used and update the password atomically; also invalidate
    // any other outstanding reset tokens. Bumping tokenVersion immediately
    // kills every existing JWT for this user (all devices signed out).
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Your password has been updated. You can now sign in.' };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        activeFrameworkId: true,
        currency: true,
        portfolio: {
          select: {
            id: true,
            availableCashCents: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
