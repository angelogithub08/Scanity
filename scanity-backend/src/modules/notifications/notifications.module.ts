import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsGateway } from './notifications.gateway';
import { DatabaseModule } from '../../infra/database/database.module';
import { NotificationsRepository } from './notifications.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    NotificationsGateway,
  ],
  exports: [
    NotificationsService,
    NotificationsRepository,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
