import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ComplianceService } from './compliance.service';
import { EvaluateQueryDto } from './dto/evaluate-query.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get()
  async listFrameworks() {
    return this.complianceService.listFrameworks();
  }

  @Get('evaluate')
  @UseGuards(OptionalJwtAuthGuard)
  async evaluate(@Query() query: EvaluateQueryDto, @Req() req: Request) {
    return this.complianceService.evaluate(
      query.ticker,
      query.frameworkId,
      (req.user as { sub?: string })?.sub,
    );
  }
}
