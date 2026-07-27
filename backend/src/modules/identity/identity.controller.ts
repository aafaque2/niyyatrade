import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ComplianceService } from '../compliance/compliance.service';
import { UpdateFrameworkPrefsDto } from './dto/update-framework-prefs.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { getStartingBalance, VALID_CURRENCY_CODES } from '../../shared/constants/currency';

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
    @Request() req: { user: { sub: string } },
    @Body() body: ChangePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { passwordHash: true },
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
    await this.prisma.user.update({
      where: { id: req.user.sub },
      data: { passwordHash },
    });

    return { message: 'Password updated successfully' };
  }

  @Put('me/frameworks/active')
  async activateFramework(
    @Request() req: { user: { sub: string } },
    @Body() body: Record<string, string>,
  ) {
    const userId = req.user.sub;
    const frameworkId = body.frameworkId;
    if (!frameworkId) {
      throw new BadRequestException('frameworkId is required');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { activeFrameworkId: frameworkId },
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
    const jsonValue = overrides ?? {};

    await this.prisma.frameworkOverride.upsert({
      where: { userId_frameworkId: { userId: req.user.sub, frameworkId } },
      update: { customThresholds: jsonValue as any },
      create: {
        userId: req.user.sub,
        frameworkId,
        customThresholds: jsonValue as any,
      },
    });

    await this.compliance.invalidateUserCache(req.user.sub, frameworkId);

    return { message: 'Framework preferences updated' };
  }
}
