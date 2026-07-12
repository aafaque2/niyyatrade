import { Controller, Get, Query } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { EvaluateQueryDto } from './dto/evaluate-query.dto';

@Controller('compliance')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Get('evaluate')
  async evaluate(@Query() query: EvaluateQueryDto) {
    return this.complianceService.evaluate(query.ticker, query.frameworkId);
  }
}
