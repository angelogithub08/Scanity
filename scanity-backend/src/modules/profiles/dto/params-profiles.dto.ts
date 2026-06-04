import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ListProfilesParamsDto {
  @ApiProperty({
    description: 'Filtrar por name',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Filtrar por account_id',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  account_id?: string;

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

export class ListPaginatedProfilesParamsDto extends ListProfilesParamsDto {
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
