import { PartialType } from '@nestjs/swagger';
import { CreateAccountsDto } from './create-accounts.dto';

export class UpdateAccountsDto extends PartialType(CreateAccountsDto) {}
