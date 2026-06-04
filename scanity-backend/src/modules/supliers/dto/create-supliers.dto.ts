import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateSupliersDto {
  @ApiProperty({
    description: 'Propriedade name',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Propriedade phone',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Propriedade email',
    example: 'exemplo@email.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Propriedade responsible_name',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  responsible_name?: string;

  @ApiProperty({
    description: 'Propriedade observations',
    example: 'Exemplo',
    required: false,
  })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiProperty({
    description: 'Propriedade account_id',
    example: 'Exemplo',
    required: true,
  })
  @IsString()
  account_id: string;
}
