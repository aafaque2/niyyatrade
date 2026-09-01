/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { VALID_CURRENCY_CODES } from '../../../shared/constants/currency';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(VALID_CURRENCY_CODES)
  currency?: string;
}
