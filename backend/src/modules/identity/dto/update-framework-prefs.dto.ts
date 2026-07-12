import { IsUUID, IsObject, IsOptional } from 'class-validator';

export class UpdateFrameworkPrefsDto {
  @IsUUID()
  frameworkId: string;

  @IsObject()
  @IsOptional()
  overrides?: Record<string, number>;
}
