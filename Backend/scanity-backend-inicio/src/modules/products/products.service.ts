import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateProductsDto } from './dto/create-products.dto';
import { UpdateProductsDto } from './dto/update-products.dto';
import {
  ListProductsParamsDto,
  ListPaginatedProductsParamsDto,
} from './dto/params-products.dto';
import { Product } from './entities/product.entity';
import { ProductsRepository, PaginatedResult } from './products.repository';
import { throwIfUniqueViolation } from '../../utils/db-errors.util';
import { S3Service } from '../../infra/s3/s3.service';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly s3Service: S3Service,
  ) {}

  async findAll(
    params: ListPaginatedProductsParamsDto,
  ): Promise<PaginatedResult<Product>> {
    try {
      const result = await this.productsRepository.findAll(params);
      const data = await Promise.all(
        result.data.map(async (product) => ({
          ...product,
          image: product.thumbnail_path
            ? await this.s3Service.generateSignedUri(product.thumbnail_path)
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
        'Erro ao buscar Products paginados: ' + (error as Error).message,
      );
    }
  }

  list(params: ListProductsParamsDto): Promise<Product[]> {
    try {
      return this.productsRepository.list(params);
    } catch (error) {
      this.logger.error(
        `Erro ao listar usuários: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'Erro ao listar Products: ' + (error as Error).message,
      );
    }
  }

  /**
   * Busca produto por código de barras de forma estrita (igualdade exata).
   * Lança NotFoundException se não encontrar.
   */
  async findOneByBarcode(accountId: string, barcode: string): Promise<Product> {
    const product = await this.productsRepository.findOneByBarcode(
      accountId,
      barcode,
    );
    if (!product) {
      this.logger.warn(
        `Produto não encontrado para código de barras: ${barcode}`,
      );
      throw new NotFoundException(
        'Produto não encontrado para este código de barras.',
      );
    }
    return product;
  }

  findOne(id: string): Promise<Product> {
    try {
      return this.productsRepository.findOne(id);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar Product: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Product não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao buscar Product: ' + (error as Error).message,
      );
    }
  }

  async create(createDto: CreateProductsDto): Promise<Product> {
    try {
      const result = await this.productsRepository.create(createDto);
      this.logger.log(`Product criado com sucesso: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao criar Product: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Trata erro de constraint UNIQUE
      throwIfUniqueViolation(
        error,
        {
          products_name_account_id_unique:
            'Já existe um Produto com este nome nesta conta.',
        },
        'Erro ao criar Product: registro duplicado.',
      );

      throw new BadRequestException(
        'Erro ao criar Product: ' + (error as Error).message,
      );
    }
  }

  async update(id: string, updateDto: UpdateProductsDto): Promise<Product> {
    try {
      const result = await this.productsRepository.update(id, updateDto);
      this.logger.log(`Product atualizado com sucesso: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar Product: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Product não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao atualizar Product: ' + (error as Error).message,
      );
    }
  }

  async remove(id: string) {
    try {
      const result = await this.productsRepository.remove(id);
      this.logger.log(`Product removido com sucesso: ${id}`);
      return {
        success: true,
        message: `Registros removidos: ${result}`,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao remover Product: ${(error as Error).message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        this.logger.warn(`Product não encontrado: ID ${id}`);
        throw error;
      }
      throw new BadRequestException(
        'Erro ao remover Product: ' + (error as Error).message,
      );
    }
  }

  /**
   * Faz upload da thumbnail do produto para o S3 e atualiza o path no registro.
   */
  async uploadThumbnail(
    id: string,
    file: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.findOne(id);
    const key = `products/${id}/thumbnail.jpg`;

    if (product.thumbnail_path) {
      try {
        await this.s3Service.delete(product.thumbnail_path);
      } catch (err) {
        this.logger.warn(
          `Falha ao remover thumbnail antiga do S3: ${(err as Error).message}`,
        );
      }
    }

    await this.s3Service.upload(
      key,
      file.buffer,
      file.mimetype || 'image/jpeg',
    );
    return this.productsRepository.update(id, { thumbnail_path: key });
  }

  /**
   * Remove a thumbnail do produto no S3 e limpa o path no registro.
   */
  async deleteThumbnail(id: string): Promise<Product> {
    const product = await this.findOne(id);
    if (product.thumbnail_path) {
      try {
        await this.s3Service.delete(product.thumbnail_path);
      } catch (err) {
        this.logger.warn(
          `Falha ao deletar thumbnail do S3: ${(err as Error).message}`,
        );
      }
      await this.productsRepository.update(id, {
        thumbnail_path: null,
      } as unknown as UpdateProductsDto);
      return this.findOne(id);
    }
    return product;
  }

  /**
   * Retorna URL assinada para exibição da thumbnail do produto.
   */
  async getThumbnailUrl(id: string): Promise<{ url: string } | { url: null }> {
    const product = await this.findOne(id);
    if (!product.thumbnail_path) {
      return { url: null };
    }
    const url = await this.s3Service.generateSignedUri(product.thumbnail_path);
    return { url };
  }
}
