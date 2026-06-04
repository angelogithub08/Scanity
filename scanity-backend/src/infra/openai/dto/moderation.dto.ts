import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';

export class ModerationCreateDto {
  @IsNotEmpty({ message: 'Input é obrigatório' })
  input: string | string[];

  @IsOptional()
  @IsString({ message: 'Model deve ser uma string' })
  model?: string;
}

export class ModerationCreateBatchDto {
  @IsArray({ message: 'Inputs deve ser um array' })
  @ArrayMaxSize(1000, { message: 'Máximo de 1000 inputs por lote' })
  @IsString({ each: true, message: 'Cada input deve ser uma string' })
  @MaxLength(32768, {
    each: true,
    message: 'Cada input não pode exceder 32.768 caracteres',
  })
  inputs: string[];

  @IsOptional()
  @IsString({ message: 'Model deve ser uma string' })
  model?: string;
}

export class ModerationCategoriesDto {
  @IsBoolean({ message: 'Sexual deve ser um boolean' })
  sexual: boolean;

  @IsBoolean({ message: 'Hate deve ser um boolean' })
  hate: boolean;

  @IsBoolean({ message: 'Harassment deve ser um boolean' })
  harassment: boolean;

  @IsBoolean({ message: 'Self-harm deve ser um boolean' })
  'self-harm': boolean;

  @IsBoolean({ message: 'Sexual/minors deve ser um boolean' })
  'sexual/minors': boolean;

  @IsBoolean({ message: 'Hate/threatening deve ser um boolean' })
  'hate/threatening': boolean;

  @IsBoolean({ message: 'Violence/graphic deve ser um boolean' })
  'violence/graphic': boolean;

  @IsBoolean({ message: 'Self-harm/intent deve ser um boolean' })
  'self-harm/intent': boolean;

  @IsBoolean({ message: 'Self-harm/instructions deve ser um boolean' })
  'self-harm/instructions': boolean;

  @IsBoolean({ message: 'Harassment/threatening deve ser um boolean' })
  'harassment/threatening': boolean;

  @IsBoolean({ message: 'Violence deve ser um boolean' })
  violence: boolean;
}

export class ModerationCategoryScoresDto {
  @IsNumber({}, { message: 'Sexual score deve ser um número' })
  @Min(0, { message: 'Sexual score deve ser maior ou igual a 0' })
  @Max(1, { message: 'Sexual score deve ser menor ou igual a 1' })
  sexual: number;

  @IsNumber({}, { message: 'Hate score deve ser um número' })
  @Min(0, { message: 'Hate score deve ser maior ou igual a 0' })
  @Max(1, { message: 'Hate score deve ser menor ou igual a 1' })
  hate: number;

  @IsNumber({}, { message: 'Harassment score deve ser um número' })
  @Min(0, { message: 'Harassment score deve ser maior ou igual a 0' })
  @Max(1, { message: 'Harassment score deve ser menor ou igual a 1' })
  harassment: number;

  @IsNumber({}, { message: 'Self-harm score deve ser um número' })
  @Min(0, { message: 'Self-harm score deve ser maior ou igual a 0' })
  @Max(1, { message: 'Self-harm score deve ser menor ou igual a 1' })
  'self-harm': number;

  @IsNumber({}, { message: 'Sexual/minors score deve ser um número' })
  @Min(0, { message: 'Sexual/minors score deve ser maior ou igual a 0' })
  @Max(1, { message: 'Sexual/minors score deve ser menor ou igual a 1' })
  'sexual/minors': number;

  @IsNumber({}, { message: 'Hate/threatening score deve ser um número' })
  @Min(0, { message: 'Hate/threatening score deve ser maior ou igual a 0' })
  @Max(1, { message: 'Hate/threatening score deve ser menor ou igual a 1' })
  'hate/threatening': number;

  @IsNumber({}, { message: 'Violence/graphic score deve ser um número' })
  @Min(0, { message: 'Violence/graphic score deve ser maior ou igual a 0' })
  @Max(1, { message: 'Violence/graphic score deve ser menor ou igual a 1' })
  'violence/graphic': number;

  @IsNumber({}, { message: 'Self-harm/intent score deve ser um número' })
  @Min(0, { message: 'Self-harm/intent score deve ser maior ou igual a 0' })
  @Max(1, { message: 'Self-harm/intent score deve ser menor ou igual a 1' })
  'self-harm/intent': number;

  @IsNumber({}, { message: 'Self-harm/instructions score deve ser um número' })
  @Min(0, {
    message: 'Self-harm/instructions score deve ser maior ou igual a 0',
  })
  @Max(1, {
    message: 'Self-harm/instructions score deve ser menor ou igual a 1',
  })
  'self-harm/instructions': number;

  @IsNumber({}, { message: 'Harassment/threatening score deve ser um número' })
  @Min(0, {
    message: 'Harassment/threatening score deve ser maior ou igual a 0',
  })
  @Max(1, {
    message: 'Harassment/threatening score deve ser menor ou igual a 1',
  })
  'harassment/threatening': number;

  @IsNumber({}, { message: 'Violence score deve ser um número' })
  @Min(0, { message: 'Violence score deve ser maior ou igual a 0' })
  @Max(1, { message: 'Violence score deve ser menor ou igual a 1' })
  violence: number;
}

export class ModerationResultDto {
  @IsBoolean({ message: 'Flagged deve ser um boolean' })
  flagged: boolean;

  categories: ModerationCategoriesDto;

  category_scores: ModerationCategoryScoresDto;
}

export class ModerationResponseDto {
  @IsString({ message: 'Id deve ser uma string' })
  id: string;

  @IsString({ message: 'Model deve ser uma string' })
  model: string;

  @IsArray({ message: 'Results deve ser um array' })
  results: ModerationResultDto[];
}

// Classes para análise de risco
export class ModerationAnalysisDto {
  @IsBoolean({ message: 'IsSafe deve ser um boolean' })
  isSafe: boolean;

  @IsNumber({}, { message: 'RiskScore deve ser um número' })
  @Min(0, { message: 'RiskScore deve ser maior ou igual a 0' })
  @Max(1, { message: 'RiskScore deve ser menor ou igual a 1' })
  riskScore: number;

  @IsArray({ message: 'ViolatedCategories deve ser um array' })
  @IsString({
    each: true,
    message: 'Cada categoria violada deve ser uma string',
  })
  violatedCategories: string[];

  @IsArray({ message: 'HighRiskCategories deve ser um array' })
  @IsString({
    each: true,
    message: 'Cada categoria de alto risco deve ser uma string',
  })
  highRiskCategories: string[];

  @IsOptional()
  @IsString({ message: 'Recommendation deve ser uma string' })
  recommendation?: 'allow' | 'review' | 'block';

  @IsOptional()
  @IsString({ message: 'Reason deve ser uma string' })
  reason?: string;
}
