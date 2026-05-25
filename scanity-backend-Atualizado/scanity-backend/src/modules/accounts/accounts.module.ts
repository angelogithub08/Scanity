import { Module } from '@nestjs/common';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { AccountsRepository } from './accounts.repository';
import { UsersModule } from '../users/users.module';
import { EmailsModule } from '../../infra/emails/emails.module';
import { TokensModule } from '../tokens/tokens.module';
import { PaymentsModule } from 'src/infra/payments/payments.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    EmailsModule,
    TokensModule,
    PaymentsModule,
    ProfilesModule,
    PermissionsModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsService, AccountsRepository],
})
export class AccountsModule {}
