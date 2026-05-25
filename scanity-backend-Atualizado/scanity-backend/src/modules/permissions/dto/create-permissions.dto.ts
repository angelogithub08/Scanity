import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreatePermissionsDto {
  @ApiProperty({
    description: 'Propriedade name',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Propriedade key_group',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  key_group: string;

  @ApiProperty({
    description: 'Propriedade key',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  key: string;
}
