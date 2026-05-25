import { PartialType } from '@nestjs/swagger';
import { CreateSupliersDto } from './create-supliers.dto';

export class UpdateSupliersDto extends PartialType(CreateSupliersDto) {}
