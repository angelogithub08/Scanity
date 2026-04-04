import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Refresh token para renovação do access token',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'ID do usuário para renovação do access token',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  user_id: string;
}
