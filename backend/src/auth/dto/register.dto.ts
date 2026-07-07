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
  @IsNotEmpty({ message: 'Nome é obrigatório.' })
  @IsString({ message: 'Nome precisa ser um texto válido.' })
  @MinLength(2, { message: 'Nome precisa ter no mínimo 2 caracteres.' })
  @MaxLength(100, { message: 'Nome pode ter no máximo 100 caracteres.' })
  @Transform(({ value }: { value: string }) => value.trim())
  name!: string;

  @ApiProperty({ example: 'lucas@email.com', maxLength: 255 })
  @IsNotEmpty({ message: 'E-mail é obrigatório.' })
  @IsEmail({}, { message: 'E-mail inválido.' })
  @MaxLength(255, { message: 'E-mail pode ter no máximo 255 caracteres.' })
  @Transform(({ value }: { value: string }) => value.trim().toLowerCase())
  email!: string;

  @ApiProperty({
    example: 'Senha@1234',
    minLength: 8,
    maxLength: 72,
    description: 'Precisa conter ao menos 1 maiúscula, 1 minúscula e 1 número.',
  })
  @IsNotEmpty({ message: 'Senha é obrigatória.' })
  @IsStrongPassword(
    {
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 0,
      minSymbols: 0,
    },
    {
      message: 'Senha deve ter no mínimo 6 caracteres, com 1 letra maiúscula e 1 letra minúscula.',
    },
  )
  @MaxLength(72, { message: 'Senha pode ter no máximo 72 caracteres.' })
  password!: string;
}
