import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationsDto } from './dto/create-notifications.dto';
import { UpdateNotificationsDto } from './dto/update-notifications.dto';
import { MarkAllReadDto } from './dto/mark-all-read.dto';
import {
  ListNotificationsParamsDto,
  ListPaginatedNotificationsParamsDto,
} from './dto/params-notifications.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import {
  getApiBodyOptions,
  getApiResponseOptions,
} from '../../utils/swagger.util';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(
    getApiBodyOptions(CreateNotificationsDto, 'Dados para criação do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      CreateNotificationsDto,
      'Registro criado com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createDto: CreateNotificationsDto) {
    return this.notificationsService.create(createDto);
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
  findAll(@Query() params: ListPaginatedNotificationsParamsDto) {
    return this.notificationsService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListNotificationsParamsDto) {
    return this.notificationsService.list(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateNotificationsDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(
      UpdateNotificationsDto,
      'Dados para atualização do registro',
    ),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateNotificationsDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateNotificationsDto) {
    return this.notificationsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiBody(
    getApiBodyOptions(
      MarkAllReadDto,
      'Dados para marcar notificações como lidas',
    ),
  )
  @ApiResponse({
    status: 200,
    description: 'Notificações marcadas como lidas com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  markAllAsRead(@Body() markAllReadDto: MarkAllReadDto) {
    return this.notificationsService.markAllAsRead(markAllReadDto);
  }
}
