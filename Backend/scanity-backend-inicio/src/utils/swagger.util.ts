import { Type } from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';

/**
 * Gera os metadados do componente ApiBody com base no tipo fornecido
 * @param dtoClass Classe do DTO
 * @param description Descrição opcional
 * @returns Opções para o decorador ApiBody
 */
export function getApiBodyOptions(dtoClass: Type<any>, description?: string) {
  return {
    type: dtoClass,
    description: description || `Dados para a operação`,
    required: true,
    schema: { $ref: getSchemaPath(dtoClass) },
  };
}

/**
 * Gera os metadados do componente ApiResponse com base no tipo fornecido
 * @param status Código de status HTTP
 * @param dtoClass Classe do DTO
 * @param description Descrição opcional
 * @returns Opções para o decorador ApiResponse
 */
export function getApiResponseOptions(
  status: number,
  dtoClass: Type<any>,
  description?: string,
) {
  return {
    status,
    description: description || `Operação concluída com sucesso`,
    schema: { $ref: getSchemaPath(dtoClass) },
  };
}
