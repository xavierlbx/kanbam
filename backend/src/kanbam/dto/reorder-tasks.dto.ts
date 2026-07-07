import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, Min, ValidateNested } from 'class-validator';

export class ReorderTaskItemDto {
  @ApiProperty({ example: 10 })
  @IsInt({ message: 'Task ID precisa ser um numero inteiro.' })
  @Min(1, { message: 'Task ID invalido.' })
  id!: number;

  @ApiProperty({ example: 2 })
  @IsInt({ message: 'Column ID precisa ser um numero inteiro.' })
  @Min(1, { message: 'Column ID invalido.' })
  columnId!: number;

  @ApiProperty({ example: 0 })
  @IsInt({ message: 'Order precisa ser um numero inteiro.' })
  @Min(0, { message: 'Order nao pode ser negativo.' })
  order!: number;
}

export class ReorderTasksDto {
  @ApiProperty({ type: [ReorderTaskItemDto] })
  @IsArray({ message: 'tasks precisa ser uma lista.' })
  @ArrayNotEmpty({ message: 'tasks nao pode ser vazio.' })
  @ValidateNested({ each: true })
  @Type(() => ReorderTaskItemDto)
  tasks!: ReorderTaskItemDto[];
}
