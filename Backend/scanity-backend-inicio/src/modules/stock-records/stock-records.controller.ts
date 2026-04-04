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
import { StockRecordsService } from './stock-records.service';
import { CreateStockRecordsDto } from './dto/create-stock-records.dto';
import { UpdateStockRecordsDto } from './dto/update-stock-records.dto';
import {
  ListStockRecordsParamsDto,
  ListPaginatedStockRecordsParamsDto,
} from './dto/params-stock-records.dto';
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

@ApiTags('Stockrecords')
@ApiBearerAuth('defaultBearerAuth')
@Controller('stock-records')
export class StockRecordsController {
  constructor(private readonly stockRecordsService: StockRecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(
    getApiBodyOptions(CreateStockRecordsDto, 'Dados para criação do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      CreateStockRecordsDto,
      'Registro criado com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createDto: CreateStockRecordsDto) {
    return this.stockRecordsService.create(createDto);
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
  findAll(@Query() params: ListPaginatedStockRecordsParamsDto) {
    return this.stockRecordsService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListStockRecordsParamsDto) {
    return this.stockRecordsService.list(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateStockRecordsDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.stockRecordsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(
      UpdateStockRecordsDto,
      'Dados para atualização do registro',
    ),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateStockRecordsDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateStockRecordsDto) {
    return this.stockRecordsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id') id: string) {
    return this.stockRecordsService.remove(id);
  }
}
