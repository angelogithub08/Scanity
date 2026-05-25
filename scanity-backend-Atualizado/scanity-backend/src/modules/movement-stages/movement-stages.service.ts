import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateMovementStagesDto } from './dto/create-movement-stages.dto';
import { UpdateMovementStagesDto } from './dto/update-movement-stages.dto';
import {
  ListMovementStagesParamsDto,
  ListPaginatedMovementStagesParamsDto,
} from './dto/params-movement-stages.dto';
import { MovementStage } from './entities/movement-stage.entity';
import {
  MovementStagesRepository,
  PaginatedResult,
} from './movement-stages.repository';

@Injectable()
export class MovementStagesService {
  private readonly logger = new Logger(MovementStagesService.name);

  constructor(
    private readonly movementStagesRepository: MovementStagesRepository,
  ) {}

  findAll(
    params: ListPaginatedMovementStagesParamsDto,
  ): Promise<PaginatedResult<MovementStage>> {
    try {
      return this.movementStagesRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar MovementStages paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListMovementStagesParamsDto): Promise<MovementStage[]> {
    try {
      return this.movementStagesRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar MovementStages: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<MovementStage> {
    try {
      return this.movementStagesRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar MovementStage: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`MovementStage não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar MovementStage: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateMovementStagesDto): Promise<MovementStage> {
    try {
      const result = await this.movementStagesRepository.create(createDto);
      this.logger.log(`MovementStage criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar MovementStage: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar MovementStage: ' + (error as Error).message,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateMovementStagesDto,
  ): Promise<MovementStage> {
    try {
      const result = await this.movementStagesRepository.update(id, updateDto);
      this.logger.log(`MovementStage atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar MovementStage: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`MovementStage não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar MovementStage: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.movementStagesRepository.remove(id);
      this.logger.log(`MovementStage removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover MovementStage: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`MovementStage não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover MovementStage: ' + (error as Error).message,
      );
    }
  }
}
