import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsJSON,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateNotificationsDto {
  @ApiProperty({
    description: 'Propriedade key',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Propriedade message',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Propriedade data',
    example: { key: 'value' },
    required: false,
  })
  @IsOptional()
  @IsJSON()
  data?: any;

  @ApiProperty({
    description: 'Propriedade account_id',
    example: 'Exemplo',
    required: true,
  })
  @IsUUID()
  account_id: string;

  @ApiProperty({
    description: 'Propriedade user_id',
    example: 'Exemplo',
    required: true,
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    description: 'Propriedade read_at',
    example: 'Exemplo',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  read_at?: string;
}
