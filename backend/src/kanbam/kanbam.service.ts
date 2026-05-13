import { Injectable } from '@nestjs/common';
import type { PrismaClient, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KanbamService {
  constructor(private prisma: PrismaService) {}

  async createBoardAndColumnsDefault(
    userId: number,
    prismaClient?: PrismaClient | Prisma.TransactionClient | PrismaService,
  ): Promise<void> {
    const client = prismaClient ?? this.prisma;

    await client.user.update({
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
