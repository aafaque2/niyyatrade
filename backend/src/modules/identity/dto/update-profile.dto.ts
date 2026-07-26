import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';
import { VALID_CURRENCY_CODES } from '../../../shared/constants/currency';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(VALID_CURRENCY_CODES)
  currency?: string;
}
