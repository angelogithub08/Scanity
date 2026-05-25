import { Module } from '@nestjs/common';
import { generateHash } from './utils/encrypt.util';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TokensModule } from './modules/tokens/tokens.module';
import { ProductsModule } from './modules/products/products.module';
import { PaymentsModule } from './infra/payments/payments.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CustomersModule } from './modules/customers/customers.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { StocksModule } from './modules/stocks/stocks.module';
import { StockRecordsModule } from './modules/stock-records/stock-records.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

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
    CategoriesModule,
    StocksModule,
    StockRecordsModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor() {
    void generateHash('123456').then(console.log);
  }
}
