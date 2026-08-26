import { IsOptional, IsUUID } from 'class-validator';

export class ActivateFrameworkDto {
  @IsOptional()
  @IsUUID(undefined, { message: 'frameworkId must be a valid UUID' })
  frameworkId?: string | null;
}
