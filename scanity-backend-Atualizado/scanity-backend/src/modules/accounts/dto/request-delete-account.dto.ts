import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestDeleteAccountDto {
  @ApiProperty({
    description: 'E-mail para confirmação de exclusão da conta',
    example: 'admin@empresa.com',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório' })
  email: string;
}
