import { ApiProperty } from '@nestjs/swagger';

export class ColumnResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Column name' })
  title!: string;

  @ApiProperty({ example: 0 })
  order!: number;
}
