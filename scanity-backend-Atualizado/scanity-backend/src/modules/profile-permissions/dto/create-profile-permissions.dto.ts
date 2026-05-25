import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateProfilePermissionsDto {
  @ApiProperty({
    description: 'Propriedade profile_id',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  profile_id: string;

  @ApiProperty({
    description: 'Propriedade permission_id',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  permission_id: string;
}
