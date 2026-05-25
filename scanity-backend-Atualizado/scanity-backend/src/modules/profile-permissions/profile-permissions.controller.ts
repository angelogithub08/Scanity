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
import { ProfilePermissionsService } from './profile-permissions.service';
import { CreateProfilePermissionsDto } from './dto/create-profile-permissions.dto';
import { UpdateProfilePermissionsDto } from './dto/update-profile-permissions.dto';
import {
  ListProfilePermissionsParamsDto,
  ListPaginatedProfilePermissionsParamsDto,
} from './dto/params-profile-permissions.dto';
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

@ApiTags('Profile Permissions')
@ApiBearerAuth('defaultBearerAuth')
@Controller('profile-permissions')
export class ProfilePermissionsController {
  constructor(
    private readonly profilePermissionsService: ProfilePermissionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(
    getApiBodyOptions(
      CreateProfilePermissionsDto,
      'Dados para criação do registro',
    ),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      CreateProfilePermissionsDto,
      'Registro criado com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(
    @Body() createDto: CreateProfilePermissionsDto,
    @CurrentUser() user: User,
  ) {
    return this.profilePermissionsService.create(createDto, user);
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
  findAll(@Query() params: ListPaginatedProfilePermissionsParamsDto) {
    return this.profilePermissionsService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListProfilePermissionsParamsDto) {
    return this.profilePermissionsService.list(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateProfilePermissionsDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.profilePermissionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(
      UpdateProfilePermissionsDto,
      'Dados para atualização do registro',
    ),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateProfilePermissionsDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProfilePermissionsDto,
    @CurrentUser() user: User,
  ) {
    return this.profilePermissionsService.update(id, updateDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.profilePermissionsService.remove(id, user);
  }
}
