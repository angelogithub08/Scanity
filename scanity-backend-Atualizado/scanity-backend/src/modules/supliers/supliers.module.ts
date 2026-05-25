import { Module } from '@nestjs/common';
import { SupliersController } from './supliers.controller';
import { SupliersService } from './supliers.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { SupliersRepository } from './supliers.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [SupliersController],
  providers: [SupliersService, SupliersRepository],
  exports: [SupliersService, SupliersRepository],
})
export class SupliersModule {}
