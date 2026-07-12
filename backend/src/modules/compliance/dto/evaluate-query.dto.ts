import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class EvaluateQueryDto {
  @IsString()
  @IsNotEmpty()
  ticker: string;

  @IsUUID()
  @IsOptional()
  frameworkId?: string;
}
