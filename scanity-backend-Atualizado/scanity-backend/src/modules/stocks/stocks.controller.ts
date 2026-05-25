import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { StocksService } from './stocks.service';
import { CreateStocksDto } from './dto/create-stocks.dto';
import { UpdateStocksDto } from './dto/update-stocks.dto';
import { QuickMovementDto } from './dto/quick-movement.dto';
import {
  ListStocksParamsDto,
  ListPaginatedStocksParamsDto,
} from './dto/params-stocks.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  getApiBodyOptions,
  getApiResponseOptions,
} from '../../utils/swagger.util';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Stocks')
@ApiBearerAuth('defaultBearerAuth')
@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Post('quick-movement')
  @ApiOperation({
    summary: 'Movimentação rápida por código de barras',
    description:
      'Busca o produto pelo código de barras (estrito), localiza o estoque e registra entrada ou saída de 1 unidade.',
  })
  @ApiBody(
    getApiBodyOptions(
      QuickMovementDto,
      'Tipo da movimentação e código de barras do produto',
    ),
  )
  @ApiResponse({ status: 201, description: 'Movimentação registrada.' })
  @ApiResponse({
    status: 404,
    description: 'Produto ou estoque não encontrado.',
  })
  quickMovement(@Body() dto: QuickMovementDto, @CurrentUser() user: User) {
    const accountId = user.account_id;
    return this.stocksService.quickMovement(dto, user.id, accountId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(getApiBodyOptions(CreateStocksDto, 'Dados para criação do registro'))
  @ApiResponse(
    getApiResponseOptions(201, CreateStocksDto, 'Registro criado com sucesso'),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createDto: CreateStocksDto, @CurrentUser() user: User) {
    return this.stocksService.create(createDto, user.id);
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
  findAll(@Query() params: ListPaginatedStocksParamsDto) {
    return this.stocksService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListStocksParamsDto) {
    return this.stocksService.list(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateStocksDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.stocksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(UpdateStocksDto, 'Dados para atualização do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateStocksDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateStocksDto) {
    return this.stocksService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id') id: string) {
    return this.stocksService.remove(id);
  }
}
