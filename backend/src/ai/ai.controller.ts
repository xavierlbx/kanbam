import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { AiService } from './ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conversar com o assistente de IA do Kanban' })
  @ApiOkResponse({ type: ChatResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado.' })
  @ApiBadRequestResponse({ description: 'Mensagem inválida ou coluna não encontrada.' })
  @ApiBadGatewayResponse({ description: 'Erro ao comunicar com o serviço de IA.' })
  async chat(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    return this.aiService.chat(user.sub, dto.message);
  }
}
