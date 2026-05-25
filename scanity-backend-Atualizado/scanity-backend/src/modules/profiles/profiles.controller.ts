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
import { ProfilesService } from './profiles.service';
import { CreateProfilesDto } from './dto/create-profiles.dto';
import { UpdateProfilesDto } from './dto/update-profiles.dto';
import {
  ListProfilesParamsDto,
  ListPaginatedProfilesParamsDto,
} from './dto/params-profiles.dto';
import { SyncProfilePermissionsDto } from './dto/sync-profile-permissions.dto';
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

@ApiTags('Profiles')
@ApiBearerAuth('defaultBearerAuth')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(
    getApiBodyOptions(CreateProfilesDto, 'Dados para criação do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      CreateProfilesDto,
      'Registro criado com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createDto: CreateProfilesDto, @CurrentUser() user: User) {
    return this.profilesService.create(createDto, user);
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
  findAll(@Query() params: ListPaginatedProfilesParamsDto) {
    return this.profilesService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListProfilesParamsDto) {
    return this.profilesService.list(params);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Sincronizar permissões de um perfil' })
  @ApiParam({ name: 'id', description: 'ID do perfil' })
  @ApiBody(
    getApiBodyOptions(
      SyncProfilePermissionsDto,
      'Lista de IDs das permissões a serem associadas ao perfil',
    ),
  )
  @ApiResponse({
    status: 200,
    description: 'Permissões sincronizadas com sucesso.',
  })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  syncPermissions(
    @Param('id') id: string,
    @Body() syncDto: SyncProfilePermissionsDto,
  ) {
    return this.profilesService.syncProfilePermissions(id, syncDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateProfilesDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.profilesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(UpdateProfilesDto, 'Dados para atualização do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateProfilesDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProfilesDto,
    @CurrentUser() user: User,
  ) {
    return this.profilesService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.profilesService.remove(id, user);
  }
}
