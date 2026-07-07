import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({ example: 'Realizar limpeza do quarto', maxLength: 255 })
  @IsNotEmpty({ message: 'Título é obrigatório.' })
  @IsString({ message: 'Título precisa ser um texto válido.' })
  @MaxLength(255, { message: 'Título pode ter no máximo 255 caracteres.' })
  @Transform(({ value }: { value: string }) => value.trim())
  title!: string;

  @ApiPropertyOptional({ example: 'Limpar o quarto e organizar os itens.', maxLength: 2000 })
  @IsOptional()
  @IsString({ message: 'Descrição precisa ser um texto válido.' })
  @MaxLength(2000, { message: 'Descrição pode ter no máximo 2000 caracteres.' })
  @Transform(({ value }: { value: string }) => value.trim())
  description?: string;

  @ApiProperty({ example: 1, description: 'ID da coluna de destino.' })
  @IsNotEmpty({ message: 'Column ID é obrigatório.' })
  @IsInt({ message: 'Column ID precisa ser um número inteiro.' })
  @Min(1, { message: 'Column ID inválido.' })
  columnId!: number;
}
