import { PartialType } from '@nestjs/swagger';
import { CreateMovementStagesDto } from './create-movement-stages.dto';

export class UpdateMovementStagesDto extends PartialType(
  CreateMovementStagesDto,
) {}
