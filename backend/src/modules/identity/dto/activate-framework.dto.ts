import { IsString, IsUUID } from 'class-validator';

export class ActivateFrameworkDto {
  @IsString()
  @IsUUID()
  frameworkId: string;
}
