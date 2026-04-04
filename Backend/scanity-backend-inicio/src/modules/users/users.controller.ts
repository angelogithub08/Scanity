import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import {
  ListUsersParamsDto,
  ListPaginatedUsersParamsDto,
} from './dto/params-users.dto';
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
import { User } from './entities/user.entity';
import { AccountType } from '../accounts/entities/account.entity';

@ApiTags('Users')
@ApiBearerAuth('defaultBearerAuth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(getApiBodyOptions(CreateUsersDto, 'Dados para criação do registro'))
  @ApiResponse(
    getApiResponseOptions(201, CreateUsersDto, 'Registro criado com sucesso'),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(@Body() createDto: CreateUsersDto) {
    // Admins não possuem restrições de recursos

    const newUser = this.usersService.create(createDto);

    return newUser;
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
    @Query() params: ListPaginatedUsersParamsDto,
    @CurrentUser() user: User,
  ) {
    if (user.account_type !== AccountType.ADMIN) {
      Object.assign(params, { account_id: user.account_id });
    }

    return this.usersService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListUsersParamsDto, @CurrentUser() user: User) {
    if (user.account_type !== AccountType.ADMIN) {
      Object.assign(params, { account_id: user.account_id });
    }

    return this.usersService.list(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateUsersDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(UpdateUsersDto, 'Dados para atualização do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateUsersDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateUsersDto) {
    return this.usersService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  async remove(@Param('id') id: string) {
    const response = await this.usersService.remove(id);

    return response;
  }
}
