import { Module } from '@nestjs/common';
import { StocksController } from './stocks.controller';
import { StocksService } from './stocks.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { StocksRepository } from './stocks.repository';
import { StockRecordsModule } from '../stock-records/stock-records.module';
import { ProductsModule } from '../products/products.module';
import { S3Module } from 'src/infra/s3/s3.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StocksSchedule } from './stocks.schedule';

@Module({
  imports: [
    DatabaseModule,
    StockRecordsModule,
    ProductsModule,
    S3Module,
    UsersModule,
    NotificationsModule,
  ],
  controllers: [StocksController],
  providers: [StocksService, StocksRepository, StocksSchedule],
  exports: [StocksService, StocksRepository],
})
export class StocksModule {}
