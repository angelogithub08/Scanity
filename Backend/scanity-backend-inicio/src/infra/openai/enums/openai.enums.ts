export enum OpenAIModel {
  // Chat Models
  GPT_4O = 'gpt-4o',
  GPT_4O_MINI = 'gpt-4o-mini',
  GPT_4_TURBO = 'gpt-4-turbo',
  GPT_4 = 'gpt-4',
  GPT_4_1_MINI = 'gpt-4.1-mini',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_5 = 'gpt-5',
  GPT_5_MINI = 'gpt-5-mini',
  GPT_5_NANO = 'gpt-5-nano',

  // Embedding Models
  TEXT_EMBEDDING_3_LARGE = 'text-embedding-3-large',
  TEXT_EMBEDDING_3_SMALL = 'text-embedding-3-small',
  TEXT_EMBEDDING_ADA_002 = 'text-embedding-ada-002',
}

export enum OpenAIRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export enum ModerationCategory {
  SEXUAL = 'sexual',
  HATE = 'hate',
  HARASSMENT = 'harassment',
  SELF_HARM = 'self-harm',
  SEXUAL_MINORS = 'sexual/minors',
  HATE_THREATENING = 'hate/threatening',
  VIOLENCE_GRAPHIC = 'violence/graphic',
  SELF_HARM_INTENT = 'self-harm/intent',
  SELF_HARM_INSTRUCTIONS = 'self-harm/instructions',
  HARASSMENT_THREATENING = 'harassment/threatening',
  VIOLENCE = 'violence',
}

export enum OpenAIErrorType {
  AUTHENTICATION_ERROR = 'authentication_error',
  PERMISSION_ERROR = 'permission_error',
  NOT_FOUND_ERROR = 'not_found_error',
  REQUEST_TOO_LARGE = 'request_too_large',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  API_ERROR = 'api_error',
  TIMEOUT_ERROR = 'timeout_error',
  CONNECTION_ERROR = 'connection_error',
}
