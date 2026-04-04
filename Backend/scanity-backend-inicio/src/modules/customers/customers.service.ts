import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateCustomersDto } from './dto/create-customers.dto';
import { UpdateCustomersDto } from './dto/update-customers.dto';
import {
  ListCustomersParamsDto,
  ListPaginatedCustomersParamsDto,
} from './dto/params-customers.dto';
import { Customer } from './entities/customer.entity';
import { CustomersRepository, PaginatedResult } from './customers.repository';
import { throwIfUniqueViolation } from '../../utils/db-errors.util';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly customersRepository: CustomersRepository) {}

  findAll(
    params: ListPaginatedCustomersParamsDto,
  ): Promise<PaginatedResult<Customer>> {
    try {
      return this.customersRepository.findAll(params);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Customers paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListCustomersParamsDto): Promise<Customer[]> {
    try {
      return this.customersRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Customers: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<Customer> {
    try {
      return this.customersRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Customer: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Customer não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Customer: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateCustomersDto): Promise<Customer> {
    try {
      const result = await this.customersRepository.create(createDto);
      this.logger.log(`Customer criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Customer: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Trata erro de constraint UNIQUE
      throwIfUniqueViolation(
        error,
        {
          customers_name_account_id_unique:
            'Já existe um Customer com este nome nesta conta.',
        },
        'Erro ao criar Customer: registro duplicado.',
      );

      throw new BadRequestException(
        'Erro ao criar Customer: ' + (error as Error).message,
      );
    }
  }

  async update(id: string, updateDto: UpdateCustomersDto): Promise<Customer> {
    try {
      const result = await this.customersRepository.update(id, updateDto);
      this.logger.log(`Customer atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Customer: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Customer não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Customer: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.customersRepository.remove(id);
      this.logger.log(`Customer removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Customer: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Customer não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Customer: ' + (error as Error).message,
      );
    }
  }
}
