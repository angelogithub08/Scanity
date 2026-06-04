import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateProfilesDto } from './dto/create-profiles.dto';
import { UpdateProfilesDto } from './dto/update-profiles.dto';
import {
  ListProfilesParamsDto,
  ListPaginatedProfilesParamsDto,
} from './dto/params-profiles.dto';
import { SyncProfilePermissionsDto } from './dto/sync-profile-permissions.dto';
import { Profile } from './entities/profile.entity';
import { ProfilesRepository, PaginatedResult } from './profiles.repository';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(private readonly profilesRepository: ProfilesRepository) {}

  findAll(
    params: ListPaginatedProfilesParamsDto,
  ): Promise<PaginatedResult<Profile>> {
    try {
      return this.profilesRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Profiles paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListProfilesParamsDto): Promise<Profile[]> {
    try {
      return this.profilesRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Profiles: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<Profile> {
    try {
      return this.profilesRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Profile: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Profile não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Profile: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateProfilesDto, user: User): Promise<Profile> {
    try {
      const result = await this.profilesRepository.create(createDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Profile: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar Profile: ' + (error as Error).message,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateProfilesDto,
    user: User,
  ): Promise<Profile> {
    try {
      const result = await this.profilesRepository.update(id, updateDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Profile: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Profile não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Profile: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string, user: User) {
    try {
      const result = await this.profilesRepository.remove(id);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Profile: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Profile não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Profile: ' + (error as Error).message,
      );
    }
  }

  async syncProfilePermissions(
    profileId: string,
    syncDto: SyncProfilePermissionsDto,
  ): Promise<{
    success: boolean;
    message: string;
    inserted: number;
    deleted: number;
  }> {
    try {
      const result = await this.profilesRepository.syncProfilePermissions(
        profileId,
        syncDto.permission_ids,
      );

      this.logger.log(
        `Permissões sincronizadas com sucesso para profile ${profileId}: ${result.deleted} removidas, ${result.inserted} inseridas`,
      );

      return {
        success: true,
        message: `Permissões sincronizadas: ${result.deleted} removidas, ${result.inserted} inseridas`,
        inserted: result.inserted,
        deleted: result.deleted,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao sincronizar permissões para profile ${profileId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof NotFoundException) {
        this.logger.warn(`Profile não encontrado: ID ${profileId}`);
        throw error;
      }

      throw new BadRequestException(
        'Erro ao sincronizar permissões do profile: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
}
