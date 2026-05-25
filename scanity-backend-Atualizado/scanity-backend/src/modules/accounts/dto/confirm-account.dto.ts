import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmAccountDto {
  @ApiProperty({
    description: 'Token de confirmação da conta',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: 'O token de confirmação é obrigatório' })
  token: string;
}
