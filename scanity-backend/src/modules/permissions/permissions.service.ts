import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreatePermissionsDto } from './dto/create-permissions.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import {
  ListPermissionsParamsDto,
  ListPaginatedPermissionsParamsDto,
} from './dto/params-permissions.dto';
import { Permission } from './entities/permission.entity';
import {
  PermissionsRepository,
  PaginatedResult,
} from './permissions.repository';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PermissionsService {
  private readonly logger = new Logger(PermissionsService.name);

  constructor(private readonly permissionsRepository: PermissionsRepository) {}

  findAll(
    params: ListPaginatedPermissionsParamsDto,
  ): Promise<PaginatedResult<Permission>> {
    try {
      return this.permissionsRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Permissions paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListPermissionsParamsDto): Promise<Permission[]> {
    try {
      return this.permissionsRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Permissions: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<Permission> {
    try {
      return this.permissionsRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Permission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Permission não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Permission: ' + (error as Error).message,
      );
    }
  }

  async create(
    createDto: CreatePermissionsDto,
    user: User,
  ): Promise<Permission> {
    try {
      const result = await this.permissionsRepository.create(createDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Permission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar Permission: ' + (error as Error).message,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdatePermissionsDto,
    user: User,
  ): Promise<Permission> {
    try {
      const result = await this.permissionsRepository.update(id, updateDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Permission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Permission não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Permission: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string, user: User) {
    try {
      const result = await this.permissionsRepository.remove(id);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Permission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Permission não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Permission: ' + (error as Error).message,
      );
    }
  }

  async findByProfileId(profileId: string): Promise<Permission[]> {
    try {
      const result =
        await this.permissionsRepository.findByProfileId(profileId);
      this.logger.log(
        `Encontradas ${result?.length || 0} permissions para profile: ${profileId}`,
      );
      return result || [];
    } catch (error) {
      this.logger.error(
        `Erro ao buscar permissions para profile: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar permissions para profile: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
}
