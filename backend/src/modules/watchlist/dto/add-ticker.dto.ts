import { IsString, IsNotEmpty } from 'class-validator';

export class AddTickerDto {
  @IsString()
  @IsNotEmpty()
  ticker: string;
}
