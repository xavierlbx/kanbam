import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { KanbamService } from './kanbam.service';
import { ColumnResponseDto } from './dto/column-response.dto';

@ApiTags('Kanbam')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('kanbam')
export class KanbamController {
  constructor(private readonly kanbamService: KanbamService) {}

  @Get('tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todas as tasks do usuário autenticado' })
  @ApiOkResponse({ type: [TaskResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado.' })
  async findAllTasks(@CurrentUser() user: JwtPayload): Promise<TaskResponseDto[]> {
    return this.kanbamService.findAllTasks(user.sub);
  }

  @Get('columns')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todas as colunas do usuário autenticado' })
  @ApiOkResponse({ type: [ColumnResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado.' })
  async findAllColumns(@CurrentUser() user: JwtPayload): Promise<ColumnResponseDto[]> {
    return this.kanbamService.findAllColumns(user.sub);
  }

  @Get('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar task por ID' })
  @ApiParam({ name: 'id', description: 'ID da task', type: Number })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado.' })
  @ApiForbiddenResponse({ description: 'Task não pertence ao usuário autenticado.' })
  @ApiNotFoundResponse({ description: 'Task não encontrada.' })
  async findTaskById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TaskResponseDto> {
    return this.kanbamService.findTaskById(user.sub, id);
  }

  @Get('columns/:columnId/tasks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar todas as tasks de uma coluna' })
  @ApiParam({ name: 'columnId', description: 'ID da coluna', type: Number })
  @ApiOkResponse({ type: [TaskResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado.' })
  @ApiForbiddenResponse({ description: 'Coluna não pertence ao usuário autenticado.' })
  @ApiNotFoundResponse({ description: 'Coluna não encontrada.' })
  async findTasksByColumn(
    @CurrentUser() user: JwtPayload,
    @Param('columnId', ParseIntPipe) columnId: number,
  ): Promise<TaskResponseDto[]> {
    return this.kanbamService.findTasksByColumn(user.sub, columnId);
  }

  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar uma nova task em uma coluna' })
  @ApiCreatedResponse({ type: TaskResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado.' })
  @ApiForbiddenResponse({ description: 'A coluna não pertence ao usuário autenticado.' })
  @ApiNotFoundResponse({ description: 'Coluna não encontrada.' })
  async createTask(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.kanbamService.createTask(user.sub, dto);
  }

  @Patch('tasks/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar uma task (título, descrição ou mover de coluna)' })
  @ApiParam({ name: 'id', description: 'ID da task', type: Number })
  @ApiOkResponse({ type: TaskResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado.' })
  @ApiForbiddenResponse({ description: 'Task não pertence ao usuário autenticado.' })
  @ApiNotFoundResponse({ description: 'Task ou coluna de destino não encontrada.' })
  async updateTask(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
  ): Promise<TaskResponseDto> {
    return this.kanbamService.updateTask(user.sub, id, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover uma task' })
  @ApiParam({ name: 'id', description: 'ID da task', type: Number })
  @ApiNoContentResponse({ description: 'Task removida com sucesso.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido ou expirado.' })
  @ApiForbiddenResponse({ description: 'Task não pertence ao usuário autenticado.' })
  @ApiNotFoundResponse({ description: 'Task não encontrada.' })
  async removeTask(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.kanbamService.removeTask(user.sub, id);
  }
}
