import { BadRequestException } from '@nestjs/common';

/**
 * Converte erro de violação de unique (PostgreSQL 23505) em BadRequestException
 * com mensagem amigável. Caso não seja erro de unique, não faz nada.
 */
export function throwIfUniqueViolation(
  error: any,
  constraintMessageMap: Record<string, string>,
  defaultMessage: string = 'Registro duplicado com os mesmos dados.',
): void {
  const isUniqueViolation = error?.code === '23505';
  if (!isUniqueViolation) {
    return;
  }

  const constraint: string | undefined = error?.constraint;
  const detail: string | undefined = error?.detail;

  if (constraint && constraintMessageMap[constraint]) {
    throw new BadRequestException(constraintMessageMap[constraint]);
  }

  // Heurística: se detalhe mencionar o campo email, retornar msg específica
  if (detail && detail.includes('(email)')) {
    throw new BadRequestException('Já existe um registro com este e-mail.');
  }

  throw new BadRequestException(defaultMessage);
}
