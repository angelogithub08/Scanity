import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateCustomersDto {
  @ApiProperty({
    description: 'Propriedade name',
    example: 'Pedro Silva',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Propriedade document',
    example: '98765432100',
    required: false,
  })
  @IsString()
  @IsOptional()
  document?: string;

  @ApiProperty({
    description: 'Propriedade phone',
    example: '11912345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'Propriedade email',
    example: 'pedro@email.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Propriedade street',
    example: 'Avenida Paulista',
    required: false,
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({
    description: 'Propriedade number',
    example: '456',
    required: false,
  })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiProperty({
    description: 'Propriedade city',
    example: 'São Paulo',
    required: false,
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({
    description: 'Propriedade state',
    example: 'SP',
    required: false,
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Propriedade neighborhood',
    example: 'Bela Vista',
    required: false,
  })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiProperty({
    description: 'Propriedade zipcode',
    example: '01310-100',
    required: false,
  })
  @IsString()
  @IsOptional()
  zipcode?: string;

  @ApiProperty({
    description: 'Propriedade complement',
    example: 'Sala 202',
    required: false,
  })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiProperty({
    description: 'Propriedade account_id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsString()
  account_id: string;
}
