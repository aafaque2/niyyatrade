import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WatchlistService } from './watchlist.service';
import { AddTickerDto } from './dto/add-ticker.dto';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  async getWatchlist(@Request() req: { user: { sub: string } }) {
    return this.watchlistService.getWatchlist(req.user.sub);
  }

  @Post()
  async addTicker(
    @Request() req: { user: { sub: string } },
    @Body() body: AddTickerDto,
  ) {
    return this.watchlistService.addTicker(req.user.sub, body.ticker);
  }

  @Delete(':ticker')
  async removeTicker(
    @Request() req: { user: { sub: string } },
    @Param('ticker') ticker: string,
  ) {
    return this.watchlistService.removeTicker(req.user.sub, ticker);
  }
}
