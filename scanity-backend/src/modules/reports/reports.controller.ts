import { Controller, Get, Query, StreamableFile, Header } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  ReportParamsBase,
  StockMovementsReportParamsDto,
  MostMovedProductsReportParamsDto,
} from './dto/params-reports.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AccountType } from '../accounts/entities/account.entity';

@ApiTags('Reports')
@ApiBearerAuth('defaultBearerAuth')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('stock-products')
  @ApiOperation({
    summary: 'Relatório: Produtos em estoque e quantidade',
    description:
      'Retorna a lista de produtos com quantidade atual e mínima em estoque. Filtros opcionais por produto e categoria.',
  })
  @ApiQuery({ name: 'account_id', required: false, description: 'ID da conta' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Pesquisar por nome ou código de barras',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    description: 'Filtrar por produto',
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    description: 'Filtrar por categoria',
  })
  @ApiResponse({ status: 200, description: 'Relatório retornado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos.' })
  getStockProducts(
    @Query() params: ReportParamsBase,
    @CurrentUser() user: User,
  ) {
    const account_id =
      user.account_type === AccountType.ADMIN && params.account_id
        ? params.account_id
        : user.account_id;
    return this.reportsService.getStockProducts({
      ...params,
      account_id,
    });
  }

  @Get('stock-products/export')
  @Header(
    'Content-Disposition',
    'attachment; filename="relatorio-produtos-em-estoque.xlsx"',
  )
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOperation({
    summary: 'Exportar relatório Produtos em estoque (Excel)',
    description:
      'Retorna o relatório em formato Excel (stream). Mesmos filtros do GET stock-products.',
  })
  @ApiQuery({ name: 'account_id', required: false, description: 'ID da conta' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Pesquisar por nome ou código de barras',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    description: 'Filtrar por produto',
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    description: 'Filtrar por categoria',
  })
  @ApiResponse({ status: 200, description: 'Arquivo Excel para download.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos.' })
  async getStockProductsExport(
    @Query() params: ReportParamsBase,
    @CurrentUser() user: User,
  ): Promise<StreamableFile> {
    const account_id =
      user.account_type === AccountType.ADMIN && params.account_id
        ? params.account_id
        : user.account_id;
    const buffer = await this.reportsService.getStockProductsExcel({
      ...params,
      account_id,
    });
    return new StreamableFile(buffer);
  }

  @Get('stock-below-minimum')
  @ApiOperation({
    summary: 'Relatório: Produtos abaixo do estoque mínimo',
    description:
      'Retorna a lista de produtos cuja quantidade atual está abaixo da quantidade mínima. Filtros opcionais por produto e categoria.',
  })
  @ApiQuery({ name: 'account_id', required: false, description: 'ID da conta' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Pesquisar por nome ou código de barras',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    description: 'Filtrar por produto',
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    description: 'Filtrar por categoria',
  })
  @ApiResponse({ status: 200, description: 'Relatório retornado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos.' })
  getStockBelowMinimum(
    @Query() params: ReportParamsBase,
    @CurrentUser() user: User,
  ) {
    const account_id =
      user.account_type === AccountType.ADMIN && params.account_id
        ? params.account_id
        : user.account_id;
    return this.reportsService.getStockBelowMinimum({
      ...params,
      account_id,
    });
  }

  @Get('stock-below-minimum/export')
  @Header(
    'Content-Disposition',
    'attachment; filename="relatorio-produtos-abaixo-estoque-minimo.xlsx"',
  )
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOperation({
    summary: 'Exportar relatório Produtos abaixo do estoque mínimo (Excel)',
    description:
      'Retorna o relatório em formato Excel (stream). Mesmos filtros do GET stock-below-minimum.',
  })
  @ApiQuery({ name: 'account_id', required: false, description: 'ID da conta' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Pesquisar por nome ou código de barras',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    description: 'Filtrar por produto',
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    description: 'Filtrar por categoria',
  })
  @ApiResponse({ status: 200, description: 'Arquivo Excel para download.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos.' })
  async getStockBelowMinimumExport(
    @Query() params: ReportParamsBase,
    @CurrentUser() user: User,
  ): Promise<StreamableFile> {
    const account_id =
      user.account_type === AccountType.ADMIN && params.account_id
        ? params.account_id
        : user.account_id;
    const buffer = await this.reportsService.getStockBelowMinimumExcel({
      ...params,
      account_id,
    });
    return new StreamableFile(buffer);
  }

  @Get('stock-movements')
  @ApiOperation({
    summary: 'Relatório: Movimentações de estoque',
    description:
      'Retorna a lista de movimentações de estoque com código de barras, produto, tipo, quantidade e usuário. Filtros opcionais.',
  })
  @ApiQuery({ name: 'account_id', required: false, description: 'ID da conta' })
  @ApiQuery({
    name: 'barcode',
    required: false,
    description: 'Filtrar por código de barras',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    description: 'Filtrar por produto',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filtrar por tipo de movimentação',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'Filtrar por usuário',
  })
  @ApiResponse({ status: 200, description: 'Relatório retornado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos.' })
  getStockMovements(
    @Query() params: StockMovementsReportParamsDto,
    @CurrentUser() user: User,
  ) {
    const account_id =
      user.account_type === AccountType.ADMIN && params.account_id
        ? params.account_id
        : user.account_id;
    return this.reportsService.getStockMovements({
      ...params,
      account_id,
    });
  }

  @Get('stock-movements/export')
  @Header(
    'Content-Disposition',
    'attachment; filename="relatorio-movimentacoes-estoque.xlsx"',
  )
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOperation({
    summary: 'Exportar relatório Movimentações de estoque (Excel)',
    description:
      'Retorna o relatório em formato Excel (stream). Mesmos filtros do GET stock-movements.',
  })
  @ApiQuery({ name: 'account_id', required: false, description: 'ID da conta' })
  @ApiQuery({
    name: 'barcode',
    required: false,
    description: 'Filtrar por código de barras',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    description: 'Filtrar por produto',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filtrar por tipo de movimentação',
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'Filtrar por usuário',
  })
  @ApiResponse({ status: 200, description: 'Arquivo Excel para download.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos.' })
  async getStockMovementsExport(
    @Query() params: StockMovementsReportParamsDto,
    @CurrentUser() user: User,
  ): Promise<StreamableFile> {
    const account_id =
      user.account_type === AccountType.ADMIN && params.account_id
        ? params.account_id
        : user.account_id;
    const buffer = await this.reportsService.getStockMovementsExcel({
      ...params,
      account_id,
    });
    return new StreamableFile(buffer);
  }

  @Get('most-moved-products')
  @ApiOperation({
    summary: 'Relatório: Produtos mais movimentados (entrada/saída)',
    description:
      'Retorna a lista agregada de produtos mais movimentados com totais de entradas, saídas, total movimentado e número de movimentações.',
  })
  @ApiQuery({ name: 'account_id', required: false, description: 'ID da conta' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Pesquisar por nome ou código de barras',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    description: 'Filtrar por produto',
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    description: 'Filtrar por categoria',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filtrar por tipo de movimentação (ENTRADA/SAIDA)',
  })
  @ApiResponse({ status: 200, description: 'Relatório retornado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos.' })
  getMostMovedProducts(
    @Query() params: MostMovedProductsReportParamsDto,
    @CurrentUser() user: User,
  ) {
    const account_id =
      user.account_type === AccountType.ADMIN && params.account_id
        ? params.account_id
        : user.account_id;
    return this.reportsService.getMostMovedProducts({
      ...params,
      account_id,
    });
  }

  @Get('most-moved-products/export')
  @Header(
    'Content-Disposition',
    'attachment; filename="relatorio-produtos-mais-movimentados.xlsx"',
  )
  @Header(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  )
  @ApiOperation({
    summary:
      'Exportar relatório Produtos mais movimentados (entrada/saída) (Excel)',
    description:
      'Retorna o relatório em formato Excel (stream). Mesmos filtros do GET most-moved-products.',
  })
  @ApiQuery({ name: 'account_id', required: false, description: 'ID da conta' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Pesquisar por nome ou código de barras',
  })
  @ApiQuery({
    name: 'product_id',
    required: false,
    description: 'Filtrar por produto',
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    description: 'Filtrar por categoria',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    description: 'Filtrar por tipo de movimentação (ENTRADA/SAIDA)',
  })
  @ApiResponse({ status: 200, description: 'Arquivo Excel para download.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos.' })
  async getMostMovedProductsExport(
    @Query() params: MostMovedProductsReportParamsDto,
    @CurrentUser() user: User,
  ): Promise<StreamableFile> {
    const account_id =
      user.account_type === AccountType.ADMIN && params.account_id
        ? params.account_id
        : user.account_id;
    const buffer = await this.reportsService.getMostMovedProductsExcel({
      ...params,
      account_id,
    });
    return new StreamableFile(buffer);
  }
}
