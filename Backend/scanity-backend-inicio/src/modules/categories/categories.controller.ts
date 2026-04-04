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
import { CategoriesService } from './categories.service';
import { CreateCategoriesDto } from './dto/create-categories.dto';
import { UpdateCategoriesDto } from './dto/update-categories.dto';
import {
  ListCategoriesParamsDto,
  ListPaginatedCategoriesParamsDto,
} from './dto/params-categories.dto';
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

@ApiTags('Categories')
@ApiBearerAuth('defaultBearerAuth')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(
    getApiBodyOptions(CreateCategoriesDto, 'Dados para criação do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      CreateCategoriesDto,
      'Registro criado com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createDto: CreateCategoriesDto) {
    return this.categoriesService.create(createDto);
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
  findAll(@Query() params: ListPaginatedCategoriesParamsDto) {
    return this.categoriesService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListCategoriesParamsDto) {
    return this.categoriesService.list(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateCategoriesDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(
      UpdateCategoriesDto,
      'Dados para atualização do registro',
    ),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateCategoriesDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCategoriesDto) {
    return this.categoriesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
