import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateCategoriesDto } from './dto/create-categories.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';
import {
  ListCategoriesParamsDto,
  ListPaginatedCategoriesParamsDto,
} from './dto/params-categories.dto';
import { Category } from './entities/category.entity';
import { CategoriesRepository, PaginatedResult } from './categories.repository';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findAll(
    params: ListPaginatedCategoriesParamsDto,
  ): Promise<PaginatedResult<Category>> {
    try {
      return this.categoriesRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Categories paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListCategoriesParamsDto): Promise<Category[]> {
    try {
      return this.categoriesRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Categories: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<Category> {
    try {
      return this.categoriesRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Category: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Category não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Category: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateCategoriesDto): Promise<Category> {
    try {
      const result = await this.categoriesRepository.create(createDto);
      this.logger.log(`Category criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Category: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar Category: ' + (error as Error).message,
      );
    }
  }

  async update(id: string, updateDto: UpdateCategoriesDto): Promise<Category> {
    try {
      const result = await this.categoriesRepository.update(id, updateDto);
      this.logger.log(`Category atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Category: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Category não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Category: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.categoriesRepository.remove(id);
      this.logger.log(`Category removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Category: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Category não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Category: ' + (error as Error).message,
      );
    }
  }
}
