import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateMovementStagesDto {
  @ApiProperty({
    description: 'Propriedade name',
    example: 'Em análise',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Propriedade account_id',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: true,
  })
  @IsUUID()
  account_id: string;
}
