import { IsString, MinLength, MaxLength, IsUUID } from 'class-validator';

export class ResetPasswordDto {
  @IsUUID()
  token: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72) // bcrypt input limit
  password: string;
}
