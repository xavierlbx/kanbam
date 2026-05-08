import { ApiProperty } from '@nestjs/swagger';

export class CreatedUserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Lucas Ferreira' })
  name!: string;

  @ApiProperty({ example: 'lucas@email.com' })
  email!: string;

  @ApiProperty({ example: '2026-05-07T20:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-05-07T20:00:00.000Z' })
  updatedAt!: Date;
}
