import { Module } from '@nestjs/common';
import { KanbamModule } from '../kanbam/kanbam.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [KanbamModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
