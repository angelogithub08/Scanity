import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { AsaasService } from './asaas/asaas.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [AsaasService],
  exports: [AsaasService],
})
export class PaymentsModule {}
