import { IsBoolean } from 'class-validator';

export class ResetPortfolioDto {
  @IsBoolean()
  confirm: boolean;
}
