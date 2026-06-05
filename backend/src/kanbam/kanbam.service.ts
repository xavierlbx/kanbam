import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { ReorderTasksDto } from './dto/reorder-tasks.dto';
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

  async reorderTasks(userId: number, dto: ReorderTasksDto): Promise<void> {
    const taskIds = dto.tasks.map((item) => item.id);
    const uniqueTaskIds = new Set(taskIds);

    if (uniqueTaskIds.size !== taskIds.length) {
      throw new BadRequestException('A lista possui tasks duplicadas.');
    }

    const targetColumnIds = [...new Set(dto.tasks.map((item) => item.columnId))];

    const [ownedTasksWithColumn, ownedColumns] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          id: { in: [...uniqueTaskIds] },
          column: { board: { userId } },
        },
        select: { id: true, columnId: true },
      }),
      this.prisma.column.findMany({
        where: {
          id: { in: targetColumnIds },
          board: { userId },
        },
        select: { id: true },
      }),
    ]);

    if (ownedTasksWithColumn.length !== uniqueTaskIds.size) {
      throw new ForbiddenException('Uma ou mais tasks não pertencem ao usuário autenticado.');
    }

    if (ownedColumns.length !== targetColumnIds.length) {
      throw new ForbiddenException('Uma ou mais colunas não pertencem ao usuário autenticado.');
    }

    const sourceColumnIds = [...new Set(ownedTasksWithColumn.map((task) => task.columnId))];
    const affectedColumnIds = [...new Set([...sourceColumnIds, ...targetColumnIds])];

    const affectedColumnTasks = await this.prisma.task.findMany({
      where: {
        columnId: { in: affectedColumnIds },
        column: { board: { userId } },
      },
      select: { id: true, columnId: true },
    });

    const payloadTaskIds = uniqueTaskIds;
    const missingTasks = affectedColumnTasks.filter((task) => !payloadTaskIds.has(task.id));
    if (missingTasks.length > 0) {
      const missingColumnIds = [...new Set(missingTasks.map((task) => task.columnId))].sort(
        (a, b) => a - b,
      );
      throw new BadRequestException(
        `Payload de reorder incompleto para as colunas afetadas: ${missingColumnIds.join(', ')}.`,
      );
    }

    const groupedByColumn = new Map<number, { id: number; columnId: number; order: number }[]>();

    for (const item of dto.tasks) {
      const current = groupedByColumn.get(item.columnId);
      if (current) {
        // ]
        current.push(item);
      } else {
        groupedByColumn.set(item.columnId, [item]);
      }
    }

    const normalizedItems: { id: number; columnId: number; order: number }[] = [];

    for (const [columnId, items] of groupedByColumn.entries()) {
      items
        .slice()
        .sort((a, b) => (a.order === b.order ? a.id - b.id : a.order - b.order))
        .forEach((item, index) => {
          normalizedItems.push({
            id: item.id,
            columnId,
            order: index,
          });
        });
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        for (let index = 0; index < normalizedItems.length; index += 1) {
          const item = normalizedItems[index];
          await tx.task.update({
            where: { id: item.id },
            data: {
              columnId: item.columnId,
              order: -(index + 1),
            },
          });
        }

        for (const item of normalizedItems) {
          await tx.task.update({
            where: { id: item.id },
            data: {
              columnId: item.columnId,
              order: item.order,
            },
          });
        }
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'Conflito de ordenação detectado. Atualize o quadro e tente novamente.',
        );
      }
      throw error;
    }
  }
}
