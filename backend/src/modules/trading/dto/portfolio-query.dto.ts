import { IsOptional, IsBooleanString } from 'class-validator';

export class PortfolioQueryDto {
  @IsOptional()
  @IsBooleanString()
  includeCompliance?: string;
}
