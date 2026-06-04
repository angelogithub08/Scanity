import { PartialType } from '@nestjs/swagger';
import { CreateTokensDto } from './create-tokens.dto';

export class UpdateTokensDto extends PartialType(CreateTokensDto) {}
