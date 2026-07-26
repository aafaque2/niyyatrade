import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { ComplianceService } from './compliance.service';
import { EvaluateQueryDto } from './dto/evaluate-query.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@ApiTags('Compliance')
@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get()
  @ApiOperation({ summary: 'List available compliance frameworks' })
  async listFrameworks() {
    return this.complianceService.listFrameworks();
  }

  @Get('evaluate')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Evaluate an asset against a compliance framework' })
  async evaluate(@Query() query: EvaluateQueryDto, @Req() req: Request) {
    return this.complianceService.evaluate(
      query.ticker,
      query.frameworkId,
      (req.user as { sub?: string })?.sub,
    );
  }
}
