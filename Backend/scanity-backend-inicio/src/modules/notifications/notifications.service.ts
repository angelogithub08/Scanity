import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateNotificationsDto } from './dto/create-notifications.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import {
  ListNotificationsParamsDto,
  ListPaginatedNotificationsParamsDto,
} from './dto/params-notifications.dto';
import { MarkAllReadDto } from './dto/mark-all-read.dto';
import { Notification } from './entities/notification.entity';
import {
  NotificationsRepository,
  PaginatedResult,
} from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  findAll(
    params: ListPaginatedNotificationsParamsDto,
  ): Promise<PaginatedResult<Notification>> {
    try {
      return this.notificationsRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Notifications paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListNotificationsParamsDto): Promise<Notification[]> {
    try {
      return this.notificationsRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Notifications: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<Notification> {
    try {
      return this.notificationsRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Notification: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Notification não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Notification: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateNotificationsDto): Promise<Notification> {
    try {
      const result = await this.notificationsRepository.create(createDto);
      this.logger.log(`Notification criado com sucesso: ${result.id}`);
      this.notificationsGateway.emitUpsert(result);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Notification: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar Notification: ' + (error as Error).message,
      );
    }
  }

  async update(
    id: string,
    updateDto: UpdateNotificationsDto,
  ): Promise<Notification> {
    try {
      const result = await this.notificationsRepository.update(id, updateDto);
      this.logger.log(`Notification atualizado com sucesso: ${id}`);
      this.notificationsGateway.emitUpsert(result);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Notification: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Notification não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Notification: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.notificationsRepository.remove(id);
      this.logger.log(`Notification removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Notification: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Notification não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Notification: ' + (error as Error).message,
      );
    }
  }

  async markAllAsRead(markAllReadDto: MarkAllReadDto) {
    try {
      const count = await this.notificationsRepository.markAllAsRead(
        markAllReadDto.user_id,
      );
      this.logger.log(
        `${count} notificações marcadas como lidas para o usuário: ${markAllReadDto.user_id}`,
      );
      return {
        success: true,
        message: `${count} notificações marcadas como lidas`,
        count,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao marcar notificações como lidas: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao marcar notificações como lidas: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
}
