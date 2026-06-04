import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateTokensDto } from './dto/create-tokens.dto';
import { UpdateTokensDto } from './dto/update-tokens.dto';
import {
  ListTokensParamsDto,
  ListPaginatedTokensParamsDto,
} from './dto/params-tokens.dto';
import { Token } from './entities/token.entity';
import { TokensRepository, PaginatedResult } from './tokens.repository';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(private readonly tokensRepository: TokensRepository) {}

  findAll(
    params: ListPaginatedTokensParamsDto,
  ): Promise<PaginatedResult<Token>> {
    try {
      return this.tokensRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Tokens paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListTokensParamsDto): Promise<Token[]> {
    try {
      return this.tokensRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Tokens: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<Token> {
    try {
      return this.tokensRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Token: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Token não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Token: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateTokensDto): Promise<Token> {
    try {
      const result = await this.tokensRepository.create(createDto);
      this.logger.log(`Token criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Token: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar Token: ' + (error as Error).message,
      );
    }
  }

  async update(id: string, updateDto: UpdateTokensDto): Promise<Token> {
    try {
      const result = await this.tokensRepository.update(id, updateDto);
      this.logger.log(`Token atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Token: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Token não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Token: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.tokensRepository.remove(id);
      this.logger.log(`Token removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Token: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Token não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Token: ' + (error as Error).message,
      );
    }
  }
}
