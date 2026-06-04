import { PartialType } from '@nestjs/swagger';
import { CreateProfilePermissionsDto } from './create-profile-permissions.dto';

export class UpdateProfilePermissionsDto extends PartialType(
  CreateProfilePermissionsDto,
) {}
