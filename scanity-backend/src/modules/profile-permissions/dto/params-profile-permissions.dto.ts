import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ListProfilePermissionsParamsDto {
  @ApiProperty({
    description: 'Filtrar por profile_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  profile_id?: string;

  @ApiProperty({
    description: 'Filtrar por permission_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  permission_id?: string;

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

export class ListPaginatedProfilePermissionsParamsDto extends ListProfilePermissionsParamsDto {
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
