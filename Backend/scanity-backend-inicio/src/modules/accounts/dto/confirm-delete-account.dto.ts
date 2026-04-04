import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmDeleteAccountDto {
  @ApiProperty({
    description: 'Token de confirmação de exclusão da conta',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsNotEmpty({ message: 'O token de confirmação é obrigatório' })
  token: string;
}
