import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { ProductsRepository } from './products.repository';
import { S3Module } from '../../infra/s3/s3.module';

@Module({
  imports: [DatabaseModule, S3Module],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
