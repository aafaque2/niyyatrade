import { IsString, IsEnum, IsNumber, Min } from 'class-validator';

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export class CreateOrderDto {
  @IsString()
  assetTicker: string;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsNumber()
  @Min(0.000001)
  quantity: number;
}
