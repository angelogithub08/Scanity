import { Module } from '@nestjs/common';
import { InventoryCountsController } from './inventory-counts.controller';
import { InventoryCountsService } from './inventory-counts.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { InventoryCountsRepository } from './inventory-counts.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [InventoryCountsController],
  providers: [InventoryCountsService, InventoryCountsRepository],
  exports: [InventoryCountsService, InventoryCountsRepository],
})
export class InventoryCountsModule {}
