import { PartialType } from '@nestjs/swagger';
import { CreateInventoryCountsDto } from './create-inventory-counts.dto';

export class UpdateInventoryCountsDto extends PartialType(
  CreateInventoryCountsDto,
) {}
