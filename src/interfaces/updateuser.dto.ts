import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// hacer     " npm install class-validator class-transformer "    si no reconoce 'class-validator'

export class UpdateUserProfileDto {

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}