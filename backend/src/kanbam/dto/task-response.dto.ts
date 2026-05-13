import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaskResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Implementar autenticação JWT' })
  title!: string;

  @ApiPropertyOptional({ example: 'Criar strategy, guard e decorator.', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 0 })
  order!: number;

  @ApiProperty({ example: 1 })
  columnId!: number;

  @ApiProperty({ example: '2026-05-13T20:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-13T20:00:00.000Z' })
  updatedAt!: Date;
}
