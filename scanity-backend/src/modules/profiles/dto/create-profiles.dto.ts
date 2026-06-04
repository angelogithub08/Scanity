import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateProfilesDto {
  @ApiProperty({
    description: 'Propriedade key',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  key: string;

  @ApiProperty({
    description: 'Propriedade name',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Propriedade account_id',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  account_id: string;
}
