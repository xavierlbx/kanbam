import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user-dto';

const SALT_ROUNDS = 12;

interface CreatedUser {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<{ id: number } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  async findByEmailForAuth(email: string): Promise<{
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findPublicUser(id: number): Promise<CreatedUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });
    return user;
  }

  async createUser(dto: CreateUserDto): Promise<CreatedUser> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: hashedPassword,
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
      select: { id: true, name: true, email: true, createdAt: true, updatedAt: true },
    });

    return user;
  }
}
