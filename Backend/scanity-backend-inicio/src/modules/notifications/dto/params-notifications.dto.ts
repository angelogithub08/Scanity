import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class ListNotificationsParamsDto {
  @ApiProperty({
    description: 'Filtrar por key',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty({
    description: 'Filtrar por message',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiProperty({
    description: 'Filtrar por data',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  data?: string;

  @ApiProperty({
    description: 'Filtrar por account_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  account_id?: string;

  @ApiProperty({
    description: 'Filtrar por user_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  user_id?: string;

  @ApiProperty({
    description: 'Filtrar por read_at',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  read_at?: string;
}

export class ListPaginatedNotificationsParamsDto extends ListNotificationsParamsDto {
  @ApiProperty({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Limite de registros por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
