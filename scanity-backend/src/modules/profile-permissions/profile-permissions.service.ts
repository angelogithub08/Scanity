import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateProfilePermissionsDto } from './dto/create-profile-permissions.dto';
import { UpdateProfilePermissionsDto } from './dto/update-profile-permissions.dto';
import {
  ListProfilePermissionsParamsDto,
  ListPaginatedProfilePermissionsParamsDto,
} from './dto/params-profile-permissions.dto';
import { ProfilePermission } from './entities/profile-permission.entity';
import {
  ProfilePermissionsRepository,
  PaginatedResult,
} from './profile-permissions.repository';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProfilePermissionsService {
  private readonly logger = new Logger(ProfilePermissionsService.name);

  constructor(
    private readonly profilePermissionsRepository: ProfilePermissionsRepository,
  ) {}

  findAll(
    params: ListPaginatedProfilePermissionsParamsDto,
  ): Promise<PaginatedResult<ProfilePermission>> {
    try {
      return this.profilePermissionsRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar ProfilePermissions paginados: ' +
          (error as Error).message,
      );
    }
  }

  list(params: ListProfilePermissionsParamsDto): Promise<ProfilePermission[]> {
    try {
      return this.profilePermissionsRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar ProfilePermissions: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<ProfilePermission> {
    try {
      return this.profilePermissionsRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar ProfilePermission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`ProfilePermission não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar ProfilePermission: ' + (error as Error).message,
      );
    }
  }

  async create(
    createDto: CreateProfilePermissionsDto,
    user: User,
  ): Promise<ProfilePermission> {
    try {
      const result = await this.profilePermissionsRepository.create(createDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar ProfilePermission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar ProfilePermission: ' + (error as Error).message,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateProfilePermissionsDto,
    user: User,
  ): Promise<ProfilePermission> {
    try {
      const result = await this.profilePermissionsRepository.update(
        id,
        updateDto,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar ProfilePermission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`ProfilePermission não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar ProfilePermission: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string, user: User) {
    try {
      const result = await this.profilePermissionsRepository.remove(id);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover ProfilePermission: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`ProfilePermission não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover ProfilePermission: ' + (error as Error).message,
      );
    }
  }
}
