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
import { PermissionsService } from './permissions.service';
import { CreatePermissionsDto } from './dto/create-permissions.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import {
  ListPermissionsParamsDto,
  ListPaginatedPermissionsParamsDto,
} from './dto/params-permissions.dto';
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

@ApiTags('Permissions')
@ApiBearerAuth('defaultBearerAuth')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(
    getApiBodyOptions(CreatePermissionsDto, 'Dados para criação do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      CreatePermissionsDto,
      'Registro criado com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createDto: CreatePermissionsDto, @CurrentUser() user: User) {
    return this.permissionsService.create(createDto, user);
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
  findAll(@Query() params: ListPaginatedPermissionsParamsDto) {
    return this.permissionsService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListPermissionsParamsDto) {
    return this.permissionsService.list(params);
  }

  @Get('profile/:profileId')
  @ApiOperation({ summary: 'Buscar permissões de um perfil pelo ID do perfil' })
  @ApiParam({ name: 'profileId', description: 'ID do perfil' })
  @ApiResponse({
    status: 200,
    description: 'Permissões do perfil encontradas com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Erro ao buscar permissões.' })
  findByProfileId(@Param('profileId') profileId: string) {
    return this.permissionsService.findByProfileId(profileId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreatePermissionsDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(
      UpdatePermissionsDto,
      'Dados para atualização do registro',
    ),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreatePermissionsDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePermissionsDto,
    @CurrentUser() user: User,
  ) {
    return this.permissionsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.permissionsService.remove(id, user);
  }
}
