import { Module } from '@nestjs/common';
import { MovementStagesController } from './movement-stages.controller';
import { MovementStagesService } from './movement-stages.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { MovementStagesRepository } from './movement-stages.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [MovementStagesController],
  providers: [MovementStagesService, MovementStagesRepository],
  exports: [MovementStagesService, MovementStagesRepository],
})
export class MovementStagesModule {}
