import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductsDto } from './dto/create-products.dto';
import { UpdateProductsDto } from './dto/update-products.dto';
import {
  ListProductsParamsDto,
  ListPaginatedProductsParamsDto,
} from './dto/params-products.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  getApiBodyOptions,
  getApiResponseOptions,
} from '../../utils/swagger.util';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AccountType } from '../accounts/entities/account.entity';

@ApiTags('Products')
@ApiBearerAuth('defaultBearerAuth')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(
    getApiBodyOptions(CreateProductsDto, 'Dados para criação do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      CreateProductsDto,
      'Registro criado com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createDto: CreateProductsDto) {
    return this.productsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os registros paginados' })
  @ApiQuery({
    name: 'page',
    type: Number,
    description: 'Número da página',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    description: 'Limite de registros por página',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  findAll(
    @Query() params: ListPaginatedProductsParamsDto,
    @CurrentUser() user: User,
  ) {
    if (user.account_type !== AccountType.ADMIN) {
      Object.assign(params, { account_id: user.account_id });
    }

    return this.productsService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListProductsParamsDto, @CurrentUser() user: User) {
    if (user.account_type !== AccountType.ADMIN) {
      Object.assign(params, { account_id: user.account_id });
    }

    return this.productsService.list(params);
  }

  @Get(':id/thumbnail/url')
  @ApiOperation({ summary: 'Obter URL assinada da thumbnail do produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse({
    status: 200,
    description: 'URL da thumbnail ou null se não houver.',
  })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  getThumbnailUrl(@Param('id') id: string) {
    return this.productsService.getThumbnailUrl(id);
  }

  @Post(':id/thumbnail')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload da thumbnail do produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateProductsDto,
      'Thumbnail enviada e produto atualizado.',
    ),
  )
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou ausente.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|gif|webp)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.productsService.uploadThumbnail(id, file);
  }

  @Delete(':id/thumbnail')
  @ApiOperation({ summary: 'Remover thumbnail do produto' })
  @ApiParam({ name: 'id', description: 'ID do produto' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateProductsDto,
      'Thumbnail removida com sucesso.',
    ),
  )
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  deleteThumbnail(@Param('id') id: string) {
    return this.productsService.deleteThumbnail(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateProductsDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(UpdateProductsDto, 'Dados para atualização do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateProductsDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateProductsDto) {
    return this.productsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
