import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateStocksDto } from './dto/create-stocks.dto';
import { UpdateStocksDto } from './dto/update-stocks.dto';
import { QuickMovementDto } from './dto/quick-movement.dto';
import {
  ListStocksParamsDto,
  ListPaginatedStocksParamsDto,
} from './dto/params-stocks.dto';
import { Stock } from './entities/stock.entity';
import { StocksRepository, PaginatedResult } from './stocks.repository';
import { StockRecordsRepository } from '../stock-records/stock-records.repository';
import { StockRecordsService } from '../stock-records/stock-records.service';
import { ProductsService } from '../products/products.service';
import { S3Service } from 'src/infra/s3/s3.service';

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);

  constructor(
    private readonly stocksRepository: StocksRepository,
    private readonly stockRecordsRepository: StockRecordsRepository,
    private readonly stockRecordsService: StockRecordsService,
    private readonly productsService: ProductsService,
    private readonly s3Service: S3Service,
  ) {}

  async findAll(
    params: ListPaginatedStocksParamsDto,
  ): Promise<PaginatedResult<Stock>> {
    try {
      const result = await this.stocksRepository.findAll(params);
      const data = await Promise.all(
        result.data.map(async (stock) => ({
          ...stock,
          product_image: stock.product_thumbnail_path
            ? await this.s3Service.generateSignedUri(
                stock.product_thumbnail_path,
              )
            : null,
        })),
      );
      return {
        ...result,
        data,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar usuários paginados: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao buscar Stocks paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListStocksParamsDto): Promise<Stock[]> {
    try {
      return this.stocksRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Stocks: ' + (error as Error).message,
      );
    }
  }

  findOne(id: string): Promise<Stock> {
    try {
      return this.stocksRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Stock: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Stock não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Stock: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateStocksDto, userId: string): Promise<Stock> {
    try {
      const { current_quantity, ...stockData } = createDto;

      const result = await this.stocksRepository.create({
        ...stockData,
        current_quantity: 0,
      });

      await this.stockRecordsRepository.create({
        stock_id: result.id,
        quantity: current_quantity,
        type: 'ENTRADA',
        user_id: userId,
        observation: 'Primeira entrada do estoque',
      });

      this.logger.log(`Stock criado com sucesso: ${result.id}`);
      return await this.findOne(result.id);
    } catch (error) {
      this.logger.error(
        `Erro ao criar Stock: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao criar Stock: ' + (error as Error).message,
      );
    }
  }

  async update(id: string, updateDto: UpdateStocksDto): Promise<Stock> {
    try {
      const result = await this.stocksRepository.update(id, updateDto);
      this.logger.log(`Stock atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Stock: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Stock não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Stock: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.stocksRepository.remove(id);
      this.logger.log(`Stock removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Stock: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Stock não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Stock: ' + (error as Error).message,
      );
    }
  }

  /**
   * Movimentação rápida: busca produto por código de barras (estrito),
   * localiza o estoque e registra entrada ou saída de 1 unidade.
   */
  async quickMovement(
    dto: QuickMovementDto,
    userId: string,
    accountId: string,
  ): Promise<{ message: string }> {
    const barcode = dto.barcode?.trim();
    if (!barcode) {
      throw new BadRequestException('Código de barras é obrigatório.');
    }

    const product = await this.productsService.findOneByBarcode(
      accountId,
      barcode,
    );

    const stocks = await this.stocksRepository.list({
      product_id: product.id,
      account_id: accountId,
    });
    const stock = stocks[0];
    if (!stock?.id) {
      this.logger.warn(`Estoque não encontrado para o produto: ${product.id}`);
      throw new NotFoundException('Estoque não encontrado para este produto.');
    }

    await this.stockRecordsService.create({
      stock_id: stock.id,
      quantity: 1,
      type: dto.type,
      user_id: userId,
      observation: 'Movimentação rápida',
      ...(dto.movement_stage_id && {
        movement_stage_id: dto.movement_stage_id,
      }),
    });

    this.logger.log(
      `Movimentação rápida registrada: product=${product.id}, type=${dto.type}`,
    );
    return { message: 'Movimentação registrada com sucesso' };
  }
}
