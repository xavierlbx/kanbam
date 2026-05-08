import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Lucas Ferreira', minLength: 2, maxLength: 100 })
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }: { value: string }) => value.trim())
  name!: string;

  @ApiProperty({ example: 'lucas@email.com', maxLength: 255 })
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email!: string;

  @ApiProperty({
    example: 'Senha@1234',
    minLength: 8,
    maxLength: 72,
    description: 'Precisa conter ao menos 1 maiuscula, 1 minuscula e 1 numero.',
  })
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0,
  })
  @MaxLength(72)
  password!: string;
}
