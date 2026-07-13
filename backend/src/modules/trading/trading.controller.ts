import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TradingService } from './trading.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PortfolioQueryDto } from './dto/portfolio-query.dto';
import { ResetPortfolioDto } from './dto/reset-portfolio.dto';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Get()
  async getPortfolio(
    @Request() req: { user: { sub: string } },
    @Query() query: PortfolioQueryDto,
  ) {
    return this.tradingService.getPortfolio(
      req.user.sub,
      query.includeCompliance === 'true',
    );
  }

  @Post('orders')
  async createOrder(
    @Request() req: { user: { sub: string } },
    @Body() body: CreateOrderDto,
  ) {
    return this.tradingService.executeMarketOrder(req.user.sub, body);
  }

  @Post('reset')
  async resetPortfolio(
    @Request() req: { user: { sub: string } },
    @Body() body: ResetPortfolioDto,
  ) {
    if (!body.confirm) {
      throw new BadRequestException('Reset must be confirmed');
    }
    await this.tradingService.resetPortfolio(req.user.sub);
    return { message: 'Portfolio reset successfully' };
  }
}
