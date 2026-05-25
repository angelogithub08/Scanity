import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { OpenAIModel } from '../enums/openai.enums';

export class EmbeddingCreateDto {
  @IsNotEmpty({ message: 'Input é obrigatório' })
  input: string | string[];

  @IsOptional()
  @IsEnum(OpenAIModel, {
    message: 'Model deve ser um modelo válido de embedding',
  })
  model?: OpenAIModel;

  @IsOptional()
  @IsString({ message: 'User deve ser uma string' })
  @MaxLength(256, { message: 'User não pode exceder 256 caracteres' })
  user?: string;

  @IsOptional()
  @IsString({ message: 'Encoding_format deve ser uma string' })
  encoding_format?: 'float' | 'base64';

  @IsOptional()
  @IsNumber({}, { message: 'Dimensions deve ser um número' })
  @Min(1, { message: 'Dimensions deve ser maior que 0' })
  @Max(3072, {
    message: 'Dimensions não pode exceder 3072 para text-embedding-3-*',
  })
  dimensions?: number;
}

export class EmbeddingCreateBatchDto {
  @IsArray({ message: 'Inputs deve ser um array' })
  @ArrayMaxSize(2048, { message: 'Máximo de 2048 inputs por lote' })
  @IsString({ each: true, message: 'Cada input deve ser uma string' })
  @MaxLength(8191, {
    each: true,
    message: 'Cada input não pode exceder 8191 tokens',
  })
  inputs: string[];

  @IsOptional()
  @IsEnum(OpenAIModel, {
    message: 'Model deve ser um modelo válido de embedding',
  })
  model?: OpenAIModel;

  @IsOptional()
  @IsString({ message: 'User deve ser uma string' })
  @MaxLength(256, { message: 'User não pode exceder 256 caracteres' })
  user?: string;

  @IsOptional()
  @IsString({ message: 'Encoding_format deve ser uma string' })
  encoding_format?: 'float' | 'base64';

  @IsOptional()
  @IsNumber({}, { message: 'Dimensions deve ser um número' })
  @Min(1, { message: 'Dimensions deve ser maior que 0' })
  @Max(3072, {
    message: 'Dimensions não pode exceder 3072 para text-embedding-3-*',
  })
  dimensions?: number;
}

export class EmbeddingUsageDto {
  @IsNumber({}, { message: 'Prompt_tokens deve ser um número' })
  prompt_tokens: number;

  @IsNumber({}, { message: 'Total_tokens deve ser um número' })
  total_tokens: number;
}

export class EmbeddingObjectDto {
  @IsString({ message: 'Object deve ser uma string' })
  object: string;

  @IsArray({ message: 'Embedding deve ser um array' })
  @IsNumber(
    {},
    { each: true, message: 'Cada valor de embedding deve ser um número' },
  )
  embedding: number[];

  @IsNumber({}, { message: 'Index deve ser um número' })
  index: number;
}

export class EmbeddingResponseDto {
  @IsString({ message: 'Object deve ser uma string' })
  object: string;

  @IsArray({ message: 'Data deve ser um array' })
  data: EmbeddingObjectDto[];

  @IsString({ message: 'Model deve ser uma string' })
  model: string;

  usage: EmbeddingUsageDto;
}
