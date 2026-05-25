import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ListPermissionsParamsDto {
  @ApiProperty({
    description: 'Filtrar por profile_id',
    example: '123',
    required: false,
  })
  @IsString()
  @IsOptional()
  profile_id?: string;

  @ApiProperty({
    description: 'Filtrar por name',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filtrar por key_group',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  key_group?: string;

  @ApiProperty({
    description: 'Filtrar por key',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty({
    description: 'Mostrar registros deletados',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  show_deleted?: boolean;
}

export class ListPaginatedPermissionsParamsDto extends ListPermissionsParamsDto {
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
