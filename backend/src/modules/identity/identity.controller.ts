import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFrameworkPrefsDto } from './dto/update-framework-prefs.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class IdentityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  async getProfile(@Request() req: { user: { sub: string } }) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        email: true,
        name: true,
        activeFrameworkId: true,
        portfolio: {
          select: { id: true, availableCashCents: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  @Put('me/framework-prefs')
  async updateFrameworkPrefs(
    @Request() req: { user: { sub: string } },
    @Body() body: UpdateFrameworkPrefsDto,
  ) {
    const { frameworkId, overrides } = body;

    await this.prisma.frameworkOverride.upsert({
      where: { userId_frameworkId: { userId: req.user.sub, frameworkId } },
      update: { customThresholds: overrides ?? {} },
      create: {
        userId: req.user.sub,
        frameworkId,
        customThresholds: overrides ?? {},
      },
    });

    return { message: 'Framework preferences updated' };
  }
}
