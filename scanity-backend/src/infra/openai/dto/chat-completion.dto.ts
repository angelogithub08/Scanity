import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OpenAIModel, OpenAIRole } from '../enums/openai.enums';

export class ChatMessageDto {
  @IsEnum(OpenAIRole, { message: 'Role deve ser system, user ou assistant' })
  @IsNotEmpty({ message: 'Role é obrigatório' })
  role: OpenAIRole;

  @IsString({ message: 'Content deve ser uma string' })
  @IsNotEmpty({ message: 'Content é obrigatório' })
  @MaxLength(50000, { message: 'Content não pode exceder 50.000 caracteres' })
  content: string;

  @IsOptional()
  @IsString({ message: 'Name deve ser uma string' })
  @MaxLength(64, { message: 'Name não pode exceder 64 caracteres' })
  name?: string;
}

export class ChatCompletionCreateDto {
  @IsArray({ message: 'Messages deve ser um array' })
  @ArrayMinSize(1, { message: 'Pelo menos uma mensagem é obrigatória' })
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsOptional()
  @IsEnum(OpenAIModel, { message: 'Model deve ser um modelo válido' })
  model?: OpenAIModel;

  @IsOptional()
  @IsNumber({}, { message: 'Temperature deve ser um número' })
  @Min(0, { message: 'Temperature deve ser maior ou igual a 0' })
  @Max(2, { message: 'Temperature deve ser menor ou igual a 2' })
  temperature?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Max_tokens deve ser um número' })
  @Min(1, { message: 'Max_tokens deve ser maior que 0' })
  @Max(4096, { message: 'Max_tokens não pode exceder 4096' })
  max_tokens?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Top_p deve ser um número' })
  @Min(0, { message: 'Top_p deve ser maior ou igual a 0' })
  @Max(1, { message: 'Top_p deve ser menor ou igual a 1' })
  top_p?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Frequency_penalty deve ser um número' })
  @Min(-2, { message: 'Frequency_penalty deve ser maior ou igual a -2' })
  @Max(2, { message: 'Frequency_penalty deve ser menor ou igual a 2' })
  frequency_penalty?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Presence_penalty deve ser um número' })
  @Min(-2, { message: 'Presence_penalty deve ser maior ou igual a -2' })
  @Max(2, { message: 'Presence_penalty deve ser menor ou igual a 2' })
  presence_penalty?: number;

  @IsOptional()
  @IsArray({ message: 'Stop deve ser um array' })
  @IsString({ each: true, message: 'Cada item de stop deve ser uma string' })
  stop?: string[];

  @IsOptional()
  @IsString({ message: 'User deve ser uma string' })
  @MaxLength(256, { message: 'User não pode exceder 256 caracteres' })
  user?: string;
}

export class ChatCompletionUsageDto {
  @IsNumber({}, { message: 'Prompt_tokens deve ser um número' })
  prompt_tokens: number;

  @IsNumber({}, { message: 'Completion_tokens deve ser um número' })
  completion_tokens: number;

  @IsNumber({}, { message: 'Total_tokens deve ser um número' })
  total_tokens: number;
}

export class ChatCompletionChoiceDto {
  @IsNumber({}, { message: 'Index deve ser um número' })
  index: number;

  @ValidateNested()
  @Type(() => ChatMessageDto)
  message: ChatMessageDto;

  @IsOptional()
  @IsString({ message: 'Finish_reason deve ser uma string' })
  finish_reason?: string;
}

export class ChatCompletionResponseDto {
  @IsString({ message: 'Id deve ser uma string' })
  id: string;

  @IsString({ message: 'Object deve ser uma string' })
  object: string;

  @IsNumber({}, { message: 'Created deve ser um número' })
  created: number;

  @IsString({ message: 'Model deve ser uma string' })
  model: string;

  @IsArray({ message: 'Choices deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ChatCompletionChoiceDto)
  choices: ChatCompletionChoiceDto[];

  @ValidateNested()
  @Type(() => ChatCompletionUsageDto)
  usage: ChatCompletionUsageDto;
}
