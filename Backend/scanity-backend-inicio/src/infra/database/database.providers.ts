import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import knex, { Knex } from 'knex';
import knexConfig from '../../../knexfile';

export const KNEX_CONNECTION = 'KNEX_CONNECTION';

export const databaseProviders: Provider[] = [
  {
    provide: KNEX_CONNECTION,
    useFactory: (config: ConfigService): Knex => {
      const environment = config.get<string>('NODE_ENV', 'development');
      return knex(knexConfig[environment]);
    },
    inject: [ConfigService],
  },
];
