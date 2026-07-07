import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskResponseDto } from '../../kanbam/dto/task-response.dto';

export type AiAction = 'CHAT' | 'CREATE_TASK';

export class ChatResponseDto {
  @ApiProperty({ enum: ['CHAT', 'CREATE_TASK'] })
  action!: AiAction;

  @ApiProperty({ example: 'Tarefa criada com sucesso na coluna To do.' })
  message!: string;

  @ApiPropertyOptional({ type: TaskResponseDto })
  task?: TaskResponseDto;
}
