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
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { CustomersModule } from '../customers/customers.module';
import { SupliersModule } from '../supliers/supliers.module';
import { MovementStagesModule } from '../movement-stages/movement-stages.module';
import { ProfilePermissionsModule } from '../profile-permissions/profile-permissions.module';
import { StockRecordsModule } from '../stock-records/stock-records.module';
import { StocksModule } from '../stocks/stocks.module';
import { InventoryCountsModule } from '../inventory-counts/inventory-counts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatHistoryModule } from '../chat-history/chat-history.module';

@Module({
  imports: [
    DatabaseModule,
    UsersModule,
    EmailsModule,
    TokensModule,
    PaymentsModule,
    ProfilesModule,
    PermissionsModule,
    ProductsModule,
    CategoriesModule,
    CustomersModule,
    SupliersModule,
    MovementStagesModule,
    ProfilePermissionsModule,
    StockRecordsModule,
    StocksModule,
    InventoryCountsModule,
    NotificationsModule,
    ChatHistoryModule,
  ],
  controllers: [AccountsController],
  providers: [AccountsService, AccountsRepository],
  exports: [AccountsService, AccountsRepository],
})
export class AccountsModule {}
