import { Module } from '@nestjs/common';
import { KanbamService } from './kanbam.service';
import { KanbamController } from './kanbam.controller';

@Module({
  controllers: [KanbamController],
  providers: [KanbamService],
  exports: [KanbamService],
})
export class KanbamModule {}
