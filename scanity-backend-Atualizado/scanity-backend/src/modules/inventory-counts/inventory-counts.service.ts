import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateInventoryCountsDto } from './dto/create-inventory-counts.dto';
import { UpdateInventoryCountsDto } from './dto/update-inventory-counts.dto';
import {
  ListInventoryCountsParamsDto,
  ListPaginatedInventoryCountsParamsDto,
} from './dto/params-inventory-counts.dto';
import { InventoryCount } from './entities/inventory-count.entity';
import {
  InventoryCountsRepository,
  PaginatedResult,
} from './inventory-counts.repository';

@Injectable()
export class InventoryCountsService {
  private readonly logger = new Logger(InventoryCountsService.name);

  constructor(
    private readonly inventoryCountsRepository: InventoryCountsRepository,
  ) {}

  findAll(
    params: ListPaginatedInventoryCountsParamsDto,
  ): Promise<PaginatedResult<InventoryCount>> {
    try {
      return this.inventoryCountsRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar InventoryCounts paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListInventoryCountsParamsDto): Promise<InventoryCount[]> {
    try {
      return this.inventoryCountsRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar InventoryCounts: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<InventoryCount> {
    try {
      return this.inventoryCountsRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar InventoryCount: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`InventoryCount não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar InventoryCount: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateInventoryCountsDto): Promise<InventoryCount> {
    try {
      const result = await this.inventoryCountsRepository.create(createDto);
      this.logger.log(`InventoryCount criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar InventoryCount: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar InventoryCount: ' + (error as Error).message,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateInventoryCountsDto,
  ): Promise<InventoryCount> {
    try {
      const result = await this.inventoryCountsRepository.update(id, updateDto);
      this.logger.log(`InventoryCount atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar InventoryCount: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`InventoryCount não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar InventoryCount: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.inventoryCountsRepository.remove(id);
      this.logger.log(`InventoryCount removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover InventoryCount: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`InventoryCount não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover InventoryCount: ' + (error as Error).message,
      );
    }
  }
}
