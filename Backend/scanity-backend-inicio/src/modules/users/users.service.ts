import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import {
  ListUsersParamsDto,
  ListPaginatedUsersParamsDto,
} from './dto/params-users.dto';
import { User } from './entities/user.entity';
import { UsersRepository, PaginatedResult } from './users.repository';
import { omit } from 'lodash';
import { generateEmailHash, generateHash } from '../../utils/encrypt.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  findAll(params: ListPaginatedUsersParamsDto): Promise<PaginatedResult<User>> {
    try {
      return this.usersRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Users paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListUsersParamsDto): Promise<User[]> {
    try {
      return this.usersRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Users: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<User> {
    try {
      return this.usersRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar User: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`User não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar User: ' + (error as Error).message,
      );
    }
  }

  findByToken(token: string, showPassword = false): Promise<User> {
    try {
      return this.usersRepository.findByToken(token, showPassword);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar User: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`User não encontrado: token ${token}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar User: ' + (error as Error).message,
      );
    }
  }

  findByEmail(email: string, showPassword = false): Promise<User> {
    try {
      return this.usersRepository.findByEmail(
        generateEmailHash(email),
        showPassword,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao buscar User: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`User não encontrado: email ${email}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar User: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateUsersDto): Promise<User> {
    if (!createDto.password) {
      throw new BadRequestException(
        'Erro ao criar User: password é obrigatório',
      );
    }

    try {
      const userData = Object.assign(createDto, {
        email: generateEmailHash(createDto.email),
        password: await generateHash(createDto.password),
      });
      const result = await this.usersRepository.create(userData);
      this.logger.log(`User criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Usuário: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar Usuário: ' + (error as Error).message,
      );
    }
  }

  async update(id: string, updateDto: UpdateUsersDto): Promise<User> {
    try {
      const userData = Object.assign({}, omit(updateDto, ['password']));

      if (updateDto.password) {
        const password = await generateHash(updateDto.password);
        Object.assign(userData, { password });
      }

      if (updateDto.email) {
        Object.assign(userData, { email: generateEmailHash(updateDto.email) });
      }

      const result = await this.usersRepository.update(id, userData);
      this.logger.log(`User atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar User: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`User não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar User: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.usersRepository.remove(id);
      this.logger.log(`User removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover User: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`User não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover User: ' + (error as Error).message,
      );
    }
  }

  async deactivateByAccountId(accountId: string): Promise<number> {
    try {
      return await this.usersRepository.deactivateByAccountId(accountId);
    } catch (error) {
      this.logger.error(
        `Erro ao desativar usuários da conta ${accountId}: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao desativar usuários da conta: ' + (error as Error).message,
      );
    }
  }
}
