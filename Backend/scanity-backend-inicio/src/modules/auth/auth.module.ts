import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../infra/database/database.module';
import { EmailsModule } from '../../infra/emails/emails.module';
import { UsersModule } from '../users/users.module';
import { TokensModule } from '../tokens/tokens.module';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AsaasWebhookGuard } from './asaas-webhook.guard';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_TTL },
    }),
    UsersModule,
    TokensModule,
    DatabaseModule,
    EmailsModule,
    AccountsModule,
  ],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AsaasWebhookGuard,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
