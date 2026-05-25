import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateSupliersDto } from './dto/create-supliers.dto';
import { UpdateSupliersDto } from './dto/update-supliers.dto';
import {
  ListSupliersParamsDto,
  ListPaginatedSupliersParamsDto,
} from './dto/params-supliers.dto';
import { Suplier } from './entities/suplier.entity';
import { SupliersRepository, PaginatedResult } from './supliers.repository';

@Injectable()
export class SupliersService {
  private readonly logger = new Logger(SupliersService.name);

  constructor(private readonly supliersRepository: SupliersRepository) {}

  findAll(
    params: ListPaginatedSupliersParamsDto,
  ): Promise<PaginatedResult<Suplier>> {
    try {
      return this.supliersRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Supliers paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListSupliersParamsDto): Promise<Suplier[]> {
    try {
      return this.supliersRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Supliers: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<Suplier> {
    try {
      return this.supliersRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Suplier: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Suplier não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Suplier: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateSupliersDto): Promise<Suplier> {
    try {
      const result = await this.supliersRepository.create(createDto);
      this.logger.log(`Suplier criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Suplier: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar Suplier: ' + (error as Error).message,
      );
    }
  }

  async update(id: string, updateDto: UpdateSupliersDto): Promise<Suplier> {
    try {
      const result = await this.supliersRepository.update(id, updateDto);
      this.logger.log(`Suplier atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Suplier: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Suplier não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Suplier: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.supliersRepository.remove(id);
      this.logger.log(`Suplier removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Suplier: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Suplier não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Suplier: ' + (error as Error).message,
      );
    }
  }
}
