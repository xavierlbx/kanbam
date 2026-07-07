import { ApiProperty } from '@nestjs/swagger';
import { CreatedUserResponseDto } from '../../users/dto/created-user-response-dto';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ type: CreatedUserResponseDto })
  user!: CreatedUserResponseDto;
}
