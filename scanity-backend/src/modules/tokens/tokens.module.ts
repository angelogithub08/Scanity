import { Module } from '@nestjs/common';
import { TokensController } from './tokens.controller';
import { TokensService } from './tokens.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { TokensRepository } from './tokens.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [TokensController],
  providers: [TokensService, TokensRepository],
  exports: [TokensService, TokensRepository],
})
export class TokensModule {}
