import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum OrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
}

export class CreateOrderDto {
  @IsString()
  assetTicker: string;

  @IsEnum(OrderSide)
  side: OrderSide;

  @IsNumber()
  @Min(0.000001)
  quantity: number;

  @IsEnum(OrderType)
  @IsOptional()
  orderType?: OrderType;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  limitPriceCents?: number;
}
