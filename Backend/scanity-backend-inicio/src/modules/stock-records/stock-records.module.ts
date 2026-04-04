import { Module } from '@nestjs/common';
import { StockRecordsController } from './stock-records.controller';
import { StockRecordsService } from './stock-records.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { StockRecordsRepository } from './stock-records.repository';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DatabaseModule, UsersModule, NotificationsModule],
  controllers: [StockRecordsController],
  providers: [StockRecordsService, StockRecordsRepository],
  exports: [StockRecordsService, StockRecordsRepository],
})
export class StockRecordsModule {}
