import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { CreatedUserResponseDto } from '../users/dto/created-user-response-dto';
import { UsersService } from '../users/users.service';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.createUser(dto);
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailForAuth(dto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const safeUser = await this.usersService.findPublicUser(user.id);

    return this.buildAuthResponse(safeUser);
  }

  async getMe(userId: number): Promise<CreatedUserResponseDto> {
    return this.usersService.findPublicUser(userId);
  }

  private buildAuthResponse(user: CreatedUserResponseDto): AuthResponseDto {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
