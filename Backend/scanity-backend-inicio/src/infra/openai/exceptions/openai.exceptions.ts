import { HttpException, HttpStatus } from '@nestjs/common';
import { OpenAIErrorType } from '../enums/openai.enums';

/**
 * Interface para representar erros da API OpenAI
 */
export interface OpenAIApiError {
  message?: string;
  status?: number;
  code?: string;
  retryAfter?: number;
  type?: string;
}

/**
 * Classe base para exceções do OpenAI
 */
export abstract class OpenAIBaseException extends HttpException {
  public readonly errorType: OpenAIErrorType;
  public readonly timestamp: Date;
  public readonly requestId?: string;
  public readonly model?: string;

  constructor(
    message: string,
    errorType: OpenAIErrorType,
    status: HttpStatus,
    requestId?: string,
    model?: string,
  ) {
    super(
      {
        message,
        error: errorType,
        timestamp: new Date().toISOString(),
        requestId,
        model,
      },
      status,
    );

    this.errorType = errorType;
    this.timestamp = new Date();
    this.requestId = requestId;
    this.model = model;
  }
}

/**
 * Erro de autenticação com a API OpenAI
 */
export class OpenAIAuthenticationException extends OpenAIBaseException {
  constructor(
    message: string = 'Falha na autenticação com OpenAI',
    requestId?: string,
  ) {
    super(
      message,
      OpenAIErrorType.AUTHENTICATION_ERROR,
      HttpStatus.UNAUTHORIZED,
      requestId,
    );
  }
}

/**
 * Erro de permissão com a API OpenAI
 */
export class OpenAIPermissionException extends OpenAIBaseException {
  constructor(
    message: string = 'Permissão negada pela API OpenAI',
    requestId?: string,
  ) {
    super(
      message,
      OpenAIErrorType.PERMISSION_ERROR,
      HttpStatus.FORBIDDEN,
      requestId,
    );
  }
}

/**
 * Recurso não encontrado na API OpenAI
 */
export class OpenAINotFoundException extends OpenAIBaseException {
  constructor(
    message: string = 'Recurso não encontrado na API OpenAI',
    requestId?: string,
    model?: string,
  ) {
    super(
      message,
      OpenAIErrorType.NOT_FOUND_ERROR,
      HttpStatus.NOT_FOUND,
      requestId,
      model,
    );
  }
}

/**
 * Requisição muito grande para a API OpenAI
 */
export class OpenAIRequestTooLargeException extends OpenAIBaseException {
  public readonly tokenCount?: number;
  public readonly maxTokens?: number;

  constructor(
    message: string = 'Requisição muito grande para a API OpenAI',
    tokenCount?: number,
    maxTokens?: number,
    requestId?: string,
    model?: string,
  ) {
    super(
      message,
      OpenAIErrorType.REQUEST_TOO_LARGE,
      HttpStatus.PAYLOAD_TOO_LARGE,
      requestId,
      model,
    );

    this.tokenCount = tokenCount;
    this.maxTokens = maxTokens;
  }
}

/**
 * Limite de rate excedido na API OpenAI
 */
export class OpenAIRateLimitException extends OpenAIBaseException {
  public readonly retryAfter?: number;
  public readonly currentUsage?: {
    requests: number;
    tokens: number;
  };
  public readonly limits?: {
    maxRequests: number;
    maxTokens: number;
  };

  constructor(
    message: string = 'Limite de rate excedido na API OpenAI',
    retryAfter?: number,
    currentUsage?: { requests: number; tokens: number },
    limits?: { maxRequests: number; maxTokens: number },
    requestId?: string,
    model?: string,
  ) {
    super(
      message,
      OpenAIErrorType.RATE_LIMIT_ERROR,
      HttpStatus.TOO_MANY_REQUESTS,
      requestId,
      model,
    );

    this.retryAfter = retryAfter;
    this.currentUsage = currentUsage;
    this.limits = limits;
  }
}

/**
 * Erro interno da API OpenAI
 */
export class OpenAIApiException extends OpenAIBaseException {
  public readonly statusCode?: number;

  constructor(
    message: string = 'Erro interno da API OpenAI',
    statusCode?: number,
    requestId?: string,
    model?: string,
  ) {
    super(
      message,
      OpenAIErrorType.API_ERROR,
      HttpStatus.BAD_GATEWAY,
      requestId,
      model,
    );

    this.statusCode = statusCode;
  }
}

/**
 * Erro de timeout na comunicação com a API OpenAI
 */
export class OpenAITimeoutException extends OpenAIBaseException {
  public readonly timeoutMs?: number;

  constructor(
    message: string = 'Timeout na comunicação com a API OpenAI',
    timeoutMs?: number,
    requestId?: string,
    model?: string,
  ) {
    super(
      message,
      OpenAIErrorType.TIMEOUT_ERROR,
      HttpStatus.REQUEST_TIMEOUT,
      requestId,
      model,
    );

    this.timeoutMs = timeoutMs;
  }
}

/**
 * Erro de conexão com a API OpenAI
 */
export class OpenAIConnectionException extends OpenAIBaseException {
  public readonly networkError?: string;

  constructor(
    message: string = 'Erro de conexão com a API OpenAI',
    networkError?: string,
    requestId?: string,
  ) {
    super(
      message,
      OpenAIErrorType.CONNECTION_ERROR,
      HttpStatus.SERVICE_UNAVAILABLE,
      requestId,
    );

    this.networkError = networkError;
  }
}

/**
 * Erro de validação de dados do OpenAI
 */
export class OpenAIValidationException extends OpenAIBaseException {
  public readonly validationErrors?: string[];

  constructor(
    message: string = 'Erro de validação nos dados enviados para OpenAI',
    validationErrors?: string[],
    requestId?: string,
    model?: string,
  ) {
    super(
      message,
      OpenAIErrorType.API_ERROR,
      HttpStatus.BAD_REQUEST,
      requestId,
      model,
    );

    this.validationErrors = validationErrors;
  }
}

/**
 * Erro de moderação de conteúdo
 */
export class OpenAIModerationException extends OpenAIBaseException {
  public readonly violatedCategories?: string[];
  public readonly riskScore?: number;

  constructor(
    message: string = 'Conteúdo violou diretrizes de moderação',
    violatedCategories?: string[],
    riskScore?: number,
    requestId?: string,
  ) {
    super(
      message,
      OpenAIErrorType.API_ERROR,
      HttpStatus.UNPROCESSABLE_ENTITY,
      requestId,
    );

    this.violatedCategories = violatedCategories;
    this.riskScore = riskScore;
  }
}

/**
 * Factory para criar exceções customizadas baseadas em erros da API
 */
export class OpenAIExceptionFactory {
  /**
   * Cria uma exceção customizada baseada no erro da API OpenAI (aceita unknown)
   */
  static createFromUnknownError(
    error: unknown,
    requestId?: string,
    model?: string,
  ): OpenAIBaseException {
    // Converte erro desconhecido para o formato esperado
    const apiError = error as OpenAIApiError;
    return this.createFromApiError(apiError, requestId, model);
  }

  /**
   * Cria uma exceção customizada baseada no erro da API OpenAI
   */
  static createFromApiError(
    error: OpenAIApiError,
    requestId?: string,
    model?: string,
  ): OpenAIBaseException {
    const message = error.message || 'Erro desconhecido da API OpenAI';

    if (error?.status) {
      switch (error.status) {
        case 401:
          return new OpenAIAuthenticationException(message, requestId);
        case 403:
          return new OpenAIPermissionException(message, requestId);
        case 404:
          return new OpenAINotFoundException(message, requestId, model);
        case 413:
          return new OpenAIRequestTooLargeException(
            message,
            undefined,
            undefined,
            requestId,
            model,
          );
        case 429:
          return new OpenAIRateLimitException(
            message,
            error.retryAfter,
            undefined,
            undefined,
            requestId,
            model,
          );
        case 500:
        case 502:
        case 503:
          return new OpenAIApiException(
            message,
            error.status,
            requestId,
            model,
          );
        default:
          return new OpenAIApiException(
            message,
            error.status,
            requestId,
            model,
          );
      }
    }

    if (error?.code === 'ECONNABORTED' || error?.code === 'ENOTFOUND') {
      return new OpenAIConnectionException(message, error.code, requestId);
    }

    if (error?.code === 'ETIMEDOUT') {
      return new OpenAITimeoutException(message, undefined, requestId, model);
    }

    // Fallback para erro genérico
    return new OpenAIApiException(message, undefined, requestId, model);
  }

  /**
   * Cria exceção de rate limit com detalhes
   */
  static createRateLimitException(
    message: string,
    currentUsage: { requests: number; tokens: number },
    limits: { maxRequests: number; maxTokens: number },
    retryAfter?: number,
    requestId?: string,
    model?: string,
  ): OpenAIRateLimitException {
    return new OpenAIRateLimitException(
      message,
      retryAfter,
      currentUsage,
      limits,
      requestId,
      model,
    );
  }

  /**
   * Cria exceção de moderação com detalhes
   */
  static createModerationException(
    message: string,
    violatedCategories: string[],
    riskScore: number,
    requestId?: string,
  ): OpenAIModerationException {
    return new OpenAIModerationException(
      message,
      violatedCategories,
      riskScore,
      requestId,
    );
  }

  /**
   * Cria exceção de validação com detalhes
   */
  static createValidationException(
    message: string,
    validationErrors: string[],
    requestId?: string,
    model?: string,
  ): OpenAIValidationException {
    return new OpenAIValidationException(
      message,
      validationErrors,
      requestId,
      model,
    );
  }
}

/**
 * Tipos para auxiliar no tratamento de exceções
 */
export type OpenAIException =
  | OpenAIAuthenticationException
  | OpenAIPermissionException
  | OpenAINotFoundException
  | OpenAIRequestTooLargeException
  | OpenAIRateLimitException
  | OpenAIApiException
  | OpenAITimeoutException
  | OpenAIConnectionException
  | OpenAIValidationException
  | OpenAIModerationException;

/**
 * Guard para verificar se é uma exceção do OpenAI
 */
export function isOpenAIException(
  error: unknown,
): error is OpenAIBaseException {
  return error instanceof OpenAIBaseException;
}

/**
 * Guard para verificar se é um erro retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (!isOpenAIException(error)) {
    return false;
  }

  const retryableTypes = [
    OpenAIErrorType.RATE_LIMIT_ERROR,
    OpenAIErrorType.API_ERROR,
    OpenAIErrorType.TIMEOUT_ERROR,
    OpenAIErrorType.CONNECTION_ERROR,
  ];

  return retryableTypes.includes(error.errorType);
}
