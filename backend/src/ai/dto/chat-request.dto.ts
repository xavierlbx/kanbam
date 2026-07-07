import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({
    example: 'Crie uma tarefa para revisar o relatório na coluna To do',
    maxLength: 2000,
  })
  @IsNotEmpty({ message: 'Mensagem é obrigatória.' })
  @IsString({ message: 'Mensagem precisa ser um texto válido.' })
  @MaxLength(2000, { message: 'Mensagem pode ter no máximo 2000 caracteres.' })
  @Transform(({ value }: { value: string }) => value.trim())
  message!: string;
}
