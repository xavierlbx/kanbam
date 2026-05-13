import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import type { UserRegisteredEvent } from '../users/users.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import type { TaskResponseDto } from './dto/task-response.dto';
import { ColumnResponseDto } from './dto/column-response.dto';

@Injectable()
export class KanbamService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async verifyTaskOwnership(
    taskId: number,
    userId: number,
  ): Promise<{ id: number; columnId: number }> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        columnId: true,
        column: { select: { board: { select: { userId: true } } } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada.');
    if (task.column.board.userId !== userId) throw new ForbiddenException('Acesso negado.');

    return { id: task.id, columnId: task.columnId };
  }

  private async verifyColumnOwnership(columnId: number, userId: number): Promise<void> {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      select: { board: { select: { userId: true } } },
    });

    if (!column) throw new NotFoundException('Coluna não encontrada.');
    if (column.board.userId !== userId) throw new ForbiddenException('Acesso negado.');
  }

  // ---------------------------------------------------------------------------
  // Tasks
  // ---------------------------------------------------------------------------

  async createTask(userId: number, dto: CreateTaskDto): Promise<TaskResponseDto> {
    await this.verifyColumnOwnership(dto.columnId, userId);

    const lastTask = await this.prisma.task.findFirst({
      where: { columnId: dto.columnId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const nextOrder = lastTask ? lastTask.order + 1 : 0;

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        order: nextOrder,
        columnId: dto.columnId,
      },
    });
  }

  async findAllTasks(userId: number): Promise<TaskResponseDto[]> {
    return this.prisma.task.findMany({
      where: { column: { board: { userId } } },
      orderBy: [{ columnId: 'asc' }, { order: 'asc' }],
    });
  }

  async findAllColumns(userId: number): Promise<ColumnResponseDto[]> {
    return this.prisma.column.findMany({
      where: { board: { userId } },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, order: true },
    });
  }

  async findTaskById(userId: number, taskId: number): Promise<TaskResponseDto> {
    await this.verifyTaskOwnership(taskId, userId);

    return this.prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        columnId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findTasksByColumn(userId: number, columnId: number): Promise<TaskResponseDto[]> {
    await this.verifyColumnOwnership(columnId, userId);

    return this.prisma.task.findMany({
      where: { columnId },
      orderBy: { order: 'asc' },
    });
  }

  async updateTask(userId: number, taskId: number, dto: UpdateTaskDto): Promise<TaskResponseDto> {
    const { columnId: currentColumnId } = await this.verifyTaskOwnership(taskId, userId);

    const baseData = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
    };

    const isMovingColumn = dto.columnId !== undefined && dto.columnId !== currentColumnId;

    if (isMovingColumn && dto.columnId !== undefined) {
      await this.verifyColumnOwnership(dto.columnId, userId);

      const lastTask = await this.prisma.task.findFirst({
        where: { columnId: dto.columnId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      const nextOrder = lastTask ? lastTask.order + 1 : 0;

      return this.prisma.task.update({
        where: { id: taskId },
        data: { ...baseData, columnId: dto.columnId, order: nextOrder },
      });
    }

    return this.prisma.task.update({ where: { id: taskId }, data: baseData });
  }

  async removeTask(userId: number, taskId: number): Promise<void> {
    await this.verifyTaskOwnership(taskId, userId);
    await this.prisma.task.delete({ where: { id: taskId } });
  }

  @OnEvent('user.registered')
  async onUserRegistered({ userId }: UserRegisteredEvent): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        boards: {
          create: {
            title: 'Board',
            columns: {
              create: [
                { title: 'Backlog', order: 0 },
                { title: 'To do', order: 1 },
                { title: 'Doing', order: 2 },
                { title: 'Done', order: 3 },
              ],
            },
          },
        },
      },
    });
  }
}
