import { PartialType } from '@nestjs/swagger';
import { CreateStockRecordsDto } from './create-stock-records.dto';

export class UpdateStockRecordsDto extends PartialType(CreateStockRecordsDto) {}
