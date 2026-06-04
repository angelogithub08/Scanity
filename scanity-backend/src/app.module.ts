import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { ProductsModule } from './modules/products/products.module';
import { PaymentsModule } from './infra/payments/payments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomersModule } from './modules/customers/customers.module';
import { SupliersModule } from './modules/supliers/supliers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { StocksModule } from './modules/stocks/stocks.module';
import { StockRecordsModule } from './modules/stock-records/stock-records.module';
import { ReportsModule } from './modules/reports/reports.module';
import { InventoryCountsModule } from './modules/inventory-counts/inventory-counts.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ProfilePermissionsModule } from './modules/profile-permissions/profile-permissions.module';
import { MovementStagesModule } from './modules/movement-stages/movement-stages.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OpenAIModule } from './infra/openai/openai.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    AuthModule,
    AccountsModule,
    UsersModule,
    TokensModule,
    ProductsModule,
    PaymentsModule,
    CustomersModule,
    SupliersModule,
    CategoriesModule,
    StocksModule,
    StockRecordsModule,
    ReportsModule,
    InventoryCountsModule,
    PermissionsModule,
    ProfilesModule,
    ProfilePermissionsModule,
    MovementStagesModule,
    NotificationsModule,
    OpenAIModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
}
