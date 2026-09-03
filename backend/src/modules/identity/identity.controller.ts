import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '../../generated/prisma/client';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import { UpdateFrameworkPrefsDto } from './dto/update-framework-prefs.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ActivateFrameworkDto } from './dto/activate-framework.dto';
import {
  getStartingBalance,
  VALID_CURRENCY_CODES,
} from '../../shared/constants/currency';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  activeFrameworkId: true,
  currency: true,
  portfolio: {
    select: { id: true, availableCashCents: true },
  },
} as const;

@Controller('users')
@UseGuards(JwtAuthGuard)
export class IdentityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly compliance: ComplianceService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('me')
  async getProfile(@Request() req: { user: { sub: string } }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Put('me/profile')
  async updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() body: UpdateProfileDto,
  ) {
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.currency !== undefined) {
      if (!VALID_CURRENCY_CODES.includes(body.currency)) {
        throw new BadRequestException(`Invalid currency: ${body.currency}`);
      }

      const currentUser = await this.prisma.user.findUnique({
        where: { id: req.user.sub },
        select: { currency: true },
      });

      if (currentUser && currentUser.currency !== body.currency) {
        updateData.currency = body.currency;

        const portfolio = await this.prisma.portfolio.findUnique({
          where: { userId: req.user.sub },
        });

        if (portfolio) {
          // Currency-change wipe keeps the Portfolio row: clear children in
          // FK-safe order (Transaction -> Order -> Position). See
          // trading.service.resetPortfolio + migration 20260903000000.
          await this.prisma.$transaction(async (tx) => {
            await tx.transaction.deleteMany({
              where: { portfolioId: portfolio.id },
            });
            await tx.order.deleteMany({
              where: { portfolioId: portfolio.id },
            });
            await tx.position.deleteMany({
              where: { portfolioId: portfolio.id },
            });
            await tx.portfolio.update({
              where: { id: portfolio.id },
              data: { availableCashCents: getStartingBalance(body.currency!) },
            });
          });
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return this.prisma.user.findUnique({
        where: { id: req.user.sub },
        select: USER_SELECT,
      });
    }

    const user = await this.prisma.user.update({
      where: { id: req.user.sub },
      data: updateData,
      select: USER_SELECT,
    });
    return user;
  }

  @Put('me/password')
  async changePassword(
    @Request() req: { user: { sub: string; email: string } },
    @Body() body: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { passwordHash: true, tokenVersion: true },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException(
        'Password change not available for OAuth accounts',
      );
    }

    const isValid = await bcrypt.compare(
      body.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12);
    const updated = await this.prisma.user.update({
      where: { id: req.user.sub },
      data: {
        passwordHash,
        // Invalidate all existing JWTs — other devices must sign in again.
        tokenVersion: { increment: 1 },
      },
    });

    // Issue a fresh token for the device that just changed the password so
    // the current session stays alive while every other device is signed out.
    const token = this.jwtService.sign({
      sub: req.user.sub,
      email: req.user.email,
      ver: updated.tokenVersion,
    });

    return { message: 'Password updated successfully', token };
  }

  @Put('me/frameworks/active')
  async activateFramework(
    @Request() req: { user: { sub: string } },
    @Body() dto: ActivateFrameworkDto,
  ) {
    const userId = req.user.sub;
    const frameworkId = dto.frameworkId ?? null;

    if (frameworkId) {
      const framework = await this.prisma.framework.findUnique({
        where: { id: frameworkId },
        select: { id: true },
      });
      if (!framework) {
        throw new NotFoundException('Framework not found');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { activeFrameworkId: frameworkId },
      select: USER_SELECT,
    });
    return user;
  }

  @Delete('me/frameworks/active')
  async deactivateFramework(@Request() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { activeFrameworkId: null },
      select: USER_SELECT,
    });
    return user;
  }

  @Get('me/framework-prefs')
  async getFrameworkPrefs(@Request() req: { user: { sub: string } }) {
    return this.prisma.frameworkOverride.findMany({
      where: { userId: req.user.sub },
      select: {
        frameworkId: true,
        customThresholds: true,
        framework: { select: { slug: true, name: true } },
      },
    });
  }

  @Put('me/framework-prefs')
  async updateFrameworkPrefs(
    @Request() req: { user: { sub: string } },
    @Body() body: UpdateFrameworkPrefsDto,
  ) {
    const { frameworkId, overrides } = body;
    const jsonValue: Prisma.InputJsonValue =
      (overrides as Prisma.InputJsonValue | undefined) ?? {};

    await this.prisma.frameworkOverride.upsert({
      where: { userId_frameworkId: { userId: req.user.sub, frameworkId } },
      update: { customThresholds: jsonValue },
      create: {
        userId: req.user.sub,
        frameworkId,
        customThresholds: jsonValue,
      },
    });

    await this.compliance.invalidateUserCache(req.user.sub, frameworkId);

    return { message: 'Framework preferences updated' };
  }
}
