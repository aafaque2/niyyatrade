import { IsString, IsOptional, IsIn, IsNumberString } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @IsOptional()
  q?: string;
}

export class CandlesQueryDto {
  @IsOptional()
  @IsIn(['1D', '1W', '1M', '1Y', 'ALL'])
  resolution?: string;

  @IsOptional()
  @IsNumberString()
  from?: string;

  @IsOptional()
  @IsNumberString()
  to?: string;

  @IsOptional()
  @IsString()
  interval?: string;
}

export class FxQueryDto {
  @IsString()
  from!: string;

  @IsString()
  to!: string;
}
