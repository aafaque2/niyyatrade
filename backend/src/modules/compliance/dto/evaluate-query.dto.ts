import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EvaluateQueryDto {
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @IsString()
  @IsOptional()
  frameworkId?: string;
}
