import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class VerifyTwoFactorDto {
  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'usuario@email.com',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'Campo de e-mail é obrigatório' })
  email: string;

  @ApiProperty({
    description: 'Código de 6 dígitos enviado por e-mail',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @Length(6, 6, { message: 'O código deve ter exatamente 6 dígitos' })
  @Matches(/^\d{6}$/, { message: 'O código deve conter apenas números' })
  code: string;
}
