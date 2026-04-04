import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AccountsService } from './accounts.service';
import { CreateAccountsDto } from './dto/create-accounts.dto';
import { UpdateAccountsDto } from './dto/update-accounts.dto';
import { RegisterAccountDto } from './dto/register-account.dto';
import { ConfirmAccountDto } from './dto/confirm-account.dto';
import { ConfirmDeleteAccountDto } from './dto/confirm-delete-account.dto';
import { RequestDeleteAccountDto } from './dto/request-delete-account.dto';
import {
  ListAccountsParamsDto,
  ListPaginatedAccountsParamsDto,
} from './dto/params-accounts.dto';
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
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Accounts')
@ApiBearerAuth('defaultBearerAuth')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nova conta com usuário inicial' })
  @ApiBody(
    getApiBodyOptions(
      RegisterAccountDto,
      'Dados para registro da conta e usuário',
    ),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      RegisterAccountDto,
      'Conta e usuário criados com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  register(@Body() registerDto: RegisterAccountDto) {
    return this.accountsService.register(registerDto);
  }

  @Public()
  @Get('confirm-account')
  @ApiOperation({ summary: 'Confirmar conta usando token de confirmação' })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para a página de login no frontend',
  })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado.' })
  @ApiResponse({ status: 404, description: 'Token não encontrado.' })
  async confirmAccount(
    @Query() confirmDto: ConfirmAccountDto,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URI || 'http://localhost:9000';
    try {
      await this.accountsService.confirmAccount(confirmDto.token);
      // Redireciona para a página de login com mensagem de sucesso
      return res.redirect(
        `${frontendUrl}/#/auth?confirmed=true&message=Conta confirmada com sucesso`,
      );
    } catch (error) {
      // Redireciona para a página de login com mensagem de erro
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao confirmar conta';
      return res.redirect(
        `${frontendUrl}/#/auth?confirmed=false&message=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  @Post('request-delete-account')
  @ApiOperation({
    summary: 'Solicitar exclusão de conta com confirmação por e-mail',
  })
  @ApiBody(
    getApiBodyOptions(
      RequestDeleteAccountDto,
      'Dados para solicitação de exclusão da conta',
    ),
  )
  @ApiResponse({
    status: 200,
    description: 'E-mail de confirmação de exclusão enviado com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Solicitação inválida.' })
  requestDeleteAccount(
    @CurrentUser() user: User,
    @Body() requestDto: RequestDeleteAccountDto,
  ) {
    return this.accountsService.requestDeleteAccount(user, requestDto);
  }

  @Public()
  @Get('confirm-delete-account')
  @ApiOperation({
    summary: 'Confirmar exclusão de conta usando token enviado por e-mail',
  })
  @ApiResponse({
    status: 302,
    description: 'Redireciona para a página de login no frontend',
  })
  async confirmDeleteAccount(
    @Query() confirmDto: ConfirmDeleteAccountDto,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URI || 'http://localhost:9000';
    try {
      await this.accountsService.confirmDeleteAccount(confirmDto.token);
      return res.redirect(
        `${frontendUrl}/#/auth?accountDeleted=true&message=Conta excluída com sucesso`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro ao excluir conta';
      return res.redirect(
        `${frontendUrl}/#/auth?accountDeleted=false&message=${encodeURIComponent(errorMessage)}`,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Criar um novo registro' })
  @ApiBody(
    getApiBodyOptions(CreateAccountsDto, 'Dados para criação do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      201,
      CreateAccountsDto,
      'Registro criado com sucesso',
    ),
  )
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  create(@Body() createDto: CreateAccountsDto) {
    return this.accountsService.create(createDto);
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
  findAll(@Query() params: ListPaginatedAccountsParamsDto) {
    return this.accountsService.findAll(params);
  }

  @Get('/list')
  @ApiOperation({ summary: 'Listar todos os registros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de registros retornada com sucesso.',
  })
  list(@Query() params: ListAccountsParamsDto) {
    return this.accountsService.list(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateAccountsDto,
      'Registro encontrado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiBody(
    getApiBodyOptions(UpdateAccountsDto, 'Dados para atualização do registro'),
  )
  @ApiResponse(
    getApiResponseOptions(
      200,
      CreateAccountsDto,
      'Registro atualizado com sucesso',
    ),
  )
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAccountsDto) {
    return this.accountsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover um registro pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do registro' })
  @ApiResponse({ status: 200, description: 'Registro removido com sucesso.' })
  @ApiResponse({ status: 404, description: 'Registro não encontrado.' })
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }
}
