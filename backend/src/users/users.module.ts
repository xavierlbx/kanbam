import { Module } from '@nestjs/common';
import { KanbamModule } from '../kanbam/kanbam.module';
import { UsersService } from './users.service';

@Module({
  imports: [KanbamModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
