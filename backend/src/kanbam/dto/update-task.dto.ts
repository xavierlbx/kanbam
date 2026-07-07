import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, ValidateIf } from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Realizar limpeza do quarto', maxLength: 255 })
  @IsOptional()
  @IsString({ message: 'Título precisa ser um texto válido.' })
  @MaxLength(255, { message: 'Título pode ter no máximo 255 caracteres.' })
  @Transform(({ value }: { value: string }) => value.trim())
  title?: string;

  @ApiPropertyOptional({
    example: 'Limpar o quarto e organizar os itens.',
    maxLength: 2000,
    nullable: true,
    description: 'Envie null para remover a descrição.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString({ message: 'Descrição precisa ser um texto válido.' })
  @MaxLength(2000, { message: 'Descrição pode ter no máximo 2000 caracteres.' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  description?: string | null;

  @ApiPropertyOptional({
    example: 2,
    description: 'Mover task para outra coluna (será adicionada ao final).',
  })
  @IsOptional()
  @IsInt({ message: 'Column ID precisa ser um número inteiro.' })
  @Min(1, { message: 'Column ID inválido.' })
  columnId?: number;
}
