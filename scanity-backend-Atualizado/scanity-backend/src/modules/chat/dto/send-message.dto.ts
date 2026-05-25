import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString({ message: 'Mensagem deve ser uma string' })
  @IsNotEmpty({ message: 'Mensagem é obrigatória' })
  @MaxLength(1000, { message: 'Mensagem não pode exceder 1000 caracteres' })
  message: string;
}
