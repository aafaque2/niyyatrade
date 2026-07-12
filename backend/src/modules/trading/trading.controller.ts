import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TradingService } from './trading.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PortfolioQueryDto } from './dto/portfolio-query.dto';

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
}
