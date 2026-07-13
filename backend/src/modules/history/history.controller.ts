import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoryService } from './history.service';

@Controller('history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get('orders')
  async getOrders(
    @Request() req: { user: { sub: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    items: unknown[];
    total: number;
    page: number;
    pages: number;
  }> {
    return this.historyService.getOrderHistory(
      req.user.sub,
      page ? Math.max(1, parseInt(page, 10)) : 1,
      limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20,
    );
  }

  @Get('compliance')
  async getCompliance(
    @Request() req: { user: { sub: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{
    items: unknown[];
    total: number;
    page: number;
    pages: number;
  }> {
    return this.historyService.getComplianceHistory(
      req.user.sub,
      page ? Math.max(1, parseInt(page, 10)) : 1,
      limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20,
    );
  }
}
