import { Module } from '@nestjs/common';
import { ProfilePermissionsController } from './profile-permissions.controller';
import { ProfilePermissionsService } from './profile-permissions.service';
import { DatabaseModule } from '../../infra/database/database.module';
import { ProfilePermissionsRepository } from './profile-permissions.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ProfilePermissionsController],
  providers: [ProfilePermissionsService, ProfilePermissionsRepository],
  exports: [ProfilePermissionsService, ProfilePermissionsRepository],
})
export class ProfilePermissionsModule {}
