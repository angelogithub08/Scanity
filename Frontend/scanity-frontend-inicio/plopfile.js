import { execSync } from 'child_process';
import fs from 'fs';

/**
 * =========================================================================================================================
 * DOCUMENTAÇÃO DO PLOPFILE
 * =========================================================================================================================
 *
 * Este arquivo contém geradores para criar componentes, páginas e funcionalidades no projeto Quasar.
 *
 * ## GERADORES DISPONÍVEIS
 *
 * 1. setup - Inicializa os componentes básicos do projeto
 *    Uso: `npx plop setup`
 *
 * 2. component - Cria um novo componente Vue
 *    Uso: `npx plop component`
 *
 * 3. dialog - Cria um novo componente de dialog
 *    Uso: `npx plop dialog`
 *
 * 4. record-menu - Cria um componente de menu para registros
 *    Uso: `npx plop record-menu`
 *
 * 5. crud-pages - Cria um conjunto completo de CRUD (interface, lista e página de registro)
 *    Uso: `npx plop crud-pages`
 *
 * 6. dashboard - Cria uma página de dashboard com componentes (contadores, gráficos e tabela)
 *    Uso: `npx plop dashboard`
 *
 * ## DASHBOARD - FUNCIONAMENTO
 *
 * O gerador dashboard cria:
 * - Componentes para o dashboard em um subdiretório específico (src/components/dashboard/[nome-dashboard]/):
 *   - CounterCard.vue - Cards com contadores e ícones com fundo degradê
 *   - ChartCard.vue - Container para gráficos usando ApexCharts
 *   - TableCard.vue - Container para tabelas de dados
 * - Página de dashboard (src/pages/dashboards/[Nome]Dashboard.vue)
 *
 * Exemplos:
 * - Se o nome for "Sales", serão criados:
 *   - Componentes em src/components/dashboard/sales/
 *   - Página em src/pages/dashboards/SalesDashboard.vue
 *
 * ## CRUD PAGES - FUNCIONAMENTO
 *
 * O gerador crud-pages é o mais importante e cria:
 * - Um arquivo de interface TypeScript (src/interfaces/[nome-modulo].ts)
 * - Uma página de listagem (src/pages/[nome-modulo]/[NomeModulo]ListPage.vue)
 * - Uma página de registro (src/pages/[nome-modulo]/[NomeSingular]RecordPage.vue)
 *
 * ### FORMATO PARA DEFINIÇÃO DE CAMPOS
 *
 * Ao executar o gerador crud-pages, você precisará fornecer os campos da entidade. O formato é:
 *
 * ```
 * nome: tipo; outrocampo: tipo; terceirocampo: tipo;
 * ```
 *
 * Exemplos:
 * - `name: string; email: string; document: string; phone: string;`
 * - `nome: string; valor: number; quantidade: number; data: Date;`
 *
 * ### MARCADORES PARA CAMPOS
 *
 * Você pode adicionar marcadores aos campos para especificar comportamentos especiais:
 *
 * - `[optional]` - Campo não obrigatório
 * - `[not-required]` - Campo não obrigatório (alternativa)
 * - `[email]` - Aplicar validação de e-mail
 * - `[phone]` - Aplicar validação de telefone
 * - `[document]` - Aplicar validação de documento (CPF/CNPJ)
 * - `[zipcode]` - Aplicar validação de CEP
 * - `[state]` - Aplicar validação de estado (UF)
 * - `[price]` - Aplicar validação de preço
 * - `[number]` - Aplicar validação de número
 *
 * Exemplos:
 * - `email: string [email]; phone: string [phone];`
 * - `document: string [document]; price: number [price]; quantity: number [number];`
 * - `address: string [optional]; notes: string [not-required];`
 *
 * ### DETECÇÃO AUTOMÁTICA DE TIPOS
 *
 * O sistema detectará automaticamente certos tipos de campos com base no nome:
 * - Campos com nome "email" terão validação de e-mail
 * - Campos com nome "phone" ou "telefone" terão validação de telefone
 * - Campos com nome "document", "documento", "cpf" ou "cnpj" terão validação de documento
 * - Campos com nome "cep", "zipCode" ou "zip_code" terão validação de CEP
 * - Campos com nome "state", "uf" ou "estado" terão validação de estado
 * - Campos com nome "price", "valor", "value" ou que contenham "price" ou "valor" terão validação de preço
 * - Campos com nome "quantity", "quantidade", "qtd", "total" ou tipo "number" terão validação de número
 *
 * ### NÚMERO DE COLUNAS NO FORMULÁRIO
 *
 * O parâmetro "columns" define quantas colunas o formulário terá:
 * - `1` - Uma coluna (100% de largura)
 * - `2` - Duas colunas (50% cada)
 * - `3` - Três colunas (33% cada) - Padrão
 * - `4` - Quatro colunas (25% cada)
 *
 * =========================================================================================================================
 */

export default function (plop) {
  // Configura o Plop para usar o recurso de não-escape quando necessário
  plop.setHelper('raw', function (options) {
    return options.fn();
  });

  // Helper para comparar valores (usado nos templates para comparações condicionais)
  plop.setHelper('eq', function (a, b) {
    return a === b;
  });

  // Configuração para evitar problemas de escape
  plop.addHelper('noEscape', (str) => str);

  // Helper para retornar um array com os dados de cada coluna
  plop.setHelper('getColumns', function (fields) {
    if (!fields) return [];

    // Processa os campos informados e retorna objetos para cada coluna
    return fields
      .split(';')
      .map((f) => f.trim())
      .filter(Boolean)
      .map((field) => {
        // Formato esperado: name: type [options]
        const parts = field.split(':');
        const name = parts[0].trim();
        let type = parts.length > 1 ? parts[1].trim() : 'string';

        // Verificar opções como [optional], [required], etc.
        const isOptional = field.includes('[optional]');
        const isRequired = !isOptional && !field.includes('[not-required]');
        const isEmail = field.includes('[email]') || name === 'email';
        const isPhone = field.includes('[phone]') || name === 'phone' || name === 'telefone';
        const isDocument =
          field.includes('[document]') ||
          name === 'document' ||
          name === 'documento' ||
          name === 'cpf' ||
          name === 'cnpj';
        const isZipCode =
          field.includes('[zipcode]') ||
          name === 'cep' ||
          name === 'zipCode' ||
          name === 'zip_code';
        const isState =
          field.includes('[state]') || name === 'state' || name === 'uf' || name === 'estado';
        const isPrice =
          field.includes('[price]') ||
          name === 'price' ||
          name === 'valor' ||
          name === 'value' ||
          name.includes('price') ||
          name.includes('valor');
        const isNumber =
          field.includes('[number]') ||
          name === 'quantity' ||
          name === 'quantidade' ||
          name === 'qtd' ||
          name === 'total' ||
          type === 'number';

        // Gera um label capitalizado a partir do nome do campo
        const label = name
          .split(/[_-]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

        return {
          name: name,
          label: label,
          field: name,
          type: type,
          isOptional: isOptional,
          isRequired: isRequired,
          isEmail: isEmail,
          isPhone: isPhone,
          isDocument: isDocument,
          isZipCode: isZipCode,
          isState: isState,
          isPrice: isPrice,
          isNumber: isNumber,
        };
      });
  });

  plop.setHelper('capitalizeCase', function (text) {
    if (!text) return '';

    return text
      .split(/[ _-]/) // Separa por espaço, underline ou hífen
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  });

  // Helper para gerar propriedades simples da entidade (apenas propriedade e tipo)
  plop.setHelper('splitEntityFields', function (fields) {
    if (!fields) return '';

    return fields
      .split(';')
      .map((f) => f.trim())
      .filter(Boolean)
      .map((field) => {
        // Formato esperado: name: type
        const parts = field.split(':');
        const name = parts[0].trim();
        let type = parts.length > 1 ? parts[1].trim() : 'string';

        // Verificar se o campo é opcional
        const isOptional = field.includes('[optional]');

        // Limpar o tipo de qualquer modificador
        type = type.split(' ')[0];

        // Retornar apenas nome da propriedade e tipo
        return `  ${name}${isOptional ? '?' : ''}: ${type} | null;`;
      })
      .join('\n');
  });

  plop.setActionType('deps', function () {
    return new Promise((resolve, reject) => {
      try {
        // Dependências básicas
        execSync('npm install --save lodash dayjs');
        execSync('npm install --save vuedraggable@next');
        execSync('npm install --save-dev @types/lodash');

        // Dependências para dashboard
        execSync('npm install --save apexcharts vue3-apexcharts');

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });

  plop.setActionType('dashboardDeps', function () {
    return new Promise((resolve, reject) => {
      try {
        // Dependências para dashboard
        console.log('Instalando dependências para dashboard...');
        execSync('npm install --save apexcharts vue3-apexcharts');
        console.log('Dependências instaladas com sucesso!');

        // Exibir mensagem importante
        console.log(
          '\n🚨 IMPORTANTE: Configure o boot file do ApexCharts no seu quasar.config.js:',
        );
        console.log('boot: [');
        console.log('  // ... outros boot files');
        console.log("  'apexcharts'");
        console.log('],');
        console.log('\nNão é mais necessário adicionar na seção de plugins.\n');

        resolve();
      } catch (error) {
        console.error('Erro ao instalar dependências:', error);
        reject(error);
      }
    });
  });

  plop.setGenerator('setup', {
    description: 'Cria os componentes iniciais',
    prompts: [],
    actions: function () {
      const actions = [
        {
          type: 'deps',
        },
      ];

      // Arquivos a serem criados no setup
      const files = [
        {
          path: 'src/components/shared/pages/DefaultPage.vue',
          template: 'plop-templates/start-components/pages/default-page.hbs',
        },
        {
          path: 'src/components/shared/pages/ListPageHeader.vue',
          template: 'plop-templates/start-components/pages/list-page-header.hbs',
        },
        {
          path: 'src/components/shared/pages/RecordPageHeader.vue',
          template: 'plop-templates/start-components/pages/record-page-header.hbs',
        },
        {
          path: 'src/components/shared/tables/DefaultTable.vue',
          template: 'plop-templates/start-components/tables/default-table.hbs',
        },
        {
          path: 'src/components/shared/tables/RecordMenu.vue',
          template: 'plop-templates/start-components/tables/record-menu.hbs',
        },
        {
          path: 'src/composables/useClipboard.ts',
          template: 'plop-templates/composables/use-clipboard.hbs',
        },
        {
          path: 'src/composables/useCurrency.ts',
          template: 'plop-templates/composables/use-currency.hbs',
        },
        {
          path: 'src/composables/useDate.ts',
          template: 'plop-templates/composables/use-date.hbs',
        },
        {
          path: 'src/composables/useDownload.ts',
          template: 'plop-templates/composables/use-download.hbs',
        },
        {
          path: 'src/composables/useFiles.ts',
          template: 'plop-templates/composables/use-files.hbs',
        },
        {
          path: 'src/composables/useHandleException.ts',
          template: 'plop-templates/composables/use-handle-exception.hbs',
        },
        {
          path: 'src/composables/useMask.ts',
          template: 'plop-templates/composables/use-mask.hbs',
        },
        {
          path: 'src/composables/useOptions.ts',
          template: 'plop-templates/composables/use-options.hbs',
        },
        {
          path: 'src/composables/useValidation.ts',
          template: 'plop-templates/composables/use-validation.hbs',
        },
      ];

      // Adiciona cada arquivo à lista de ações
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          console.log(`\x1b[33mArquivo já existe: ${file.path}\x1b[0m`);
        } else {
          actions.push({
            type: 'add',
            path: file.path,
            templateFile: file.template,
          });
        }
      });

      return actions;
    },
  });

  plop.setGenerator('component', {
    description: 'Cria um novo componente',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Qual o nome do componente? (ex: MyButton)',
      },
      {
        type: 'input',
        name: 'module',
        message: 'Qual o modulo do componente? (ex: payments)',
      },
    ],
    actions: function (data) {
      const path = `src/components/${data.module}/${plop.getHelper('pascalCase')(data.name)}.vue`;

      if (fs.existsSync(path)) {
        console.log(`\x1b[33mArquivo já existe: ${path}\x1b[0m`);
        return [];
      }

      return [
        {
          type: 'add',
          path: path,
          templateFile: 'plop-templates/component.hbs',
        },
      ];
    },
  });

  plop.setGenerator('dialog', {
    description: 'Cria uma nova dialog',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Qual o nome do componente? (ex: SearchCustomer)',
      },
      {
        type: 'input',
        name: 'module',
        message: 'Qual o modulo do componente? (ex: customers)',
      },
    ],
    actions: function (data) {
      const path = `src/components/${data.module}/${plop.getHelper('pascalCase')(data.name)}Dialog.vue`;

      if (fs.existsSync(path)) {
        console.log(`\x1b[33mArquivo já existe: ${path}\x1b[0m`);
        return [];
      }

      return [
        {
          type: 'add',
          path: path,
          templateFile: 'plop-templates/dialog.hbs',
        },
      ];
    },
  });

  plop.setGenerator('crud-pages', {
    description: 'Cria um novo crud',
    prompts: [
      {
        type: 'input',
        name: 'module',
        message: 'Qual o nome do módulo no plural em inglês? (ex: Customers)',
      },
      {
        type: 'input',
        name: 'module_pt',
        message: 'Qual o nome do módulo no plural em pt-br? (ex: Clientes)',
      },
      {
        type: 'input',
        name: 'singular',
        message: 'Qual o nome do módulo no singular em inglês? (ex: Customer)',
      },
      {
        type: 'input',
        name: 'singular_pt',
        message: 'Qual o nome do módulo no singular em pt-br? (ex: Cliente)',
      },
      {
        type: 'input',
        name: 'fields',
        message: 'Quais os campos da entidade? (ex: name: string; email: string;)',
      },
      {
        type: 'input',
        name: 'columns',
        message: 'Quantas as colunas no formulário de registro? (ex: 1, 2, 3, 4)',
      },
    ],
    actions: function (data) {
      const actions = [];
      const interfacePath = `src/interfaces/${plop.getHelper('kebabCase')(data.module)}.ts`;
      const resourcePath = `src/composables/api/use${plop.getHelper('pascalCase')(data.module)}Resource.ts`;
      const listPagePath = `src/pages/${plop.getHelper('kebabCase')(data.module)}/${plop.getHelper('pascalCase')(data.module)}ListPage.vue`;
      const recordPagePath = `src/pages/${plop.getHelper('kebabCase')(data.module)}/${plop.getHelper('pascalCase')(data.singular)}RecordPage.vue`;
      const storePath = `src/stores/${plop.getHelper('kebabCase')(data.module)}.ts`;

      // Interface
      if (fs.existsSync(interfacePath)) {
        console.log(`\x1b[33mArquivo já existe: ${interfacePath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: interfacePath,
          templateFile: 'plop-templates/interface.hbs',
        });
      }

      // Resource
      if (fs.existsSync(resourcePath)) {
        console.log(`\x1b[33mArquivo já existe: ${resourcePath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: resourcePath,
          templateFile: 'plop-templates/composables/api-resource.hbs',
        });
      }

      // List Page
      if (fs.existsSync(listPagePath)) {
        console.log(`\x1b[33mArquivo já existe: ${listPagePath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: listPagePath,
          templateFile: 'plop-templates/list-page.hbs',
        });
      }

      // Record Page
      if (fs.existsSync(recordPagePath)) {
        console.log(`\x1b[33mArquivo já existe: ${recordPagePath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: recordPagePath,
          templateFile: 'plop-templates/record-page.hbs',
        });
      }

      // Store

      if (fs.existsSync(storePath)) {
        console.log(`\x1b[33mArquivo já existe: ${storePath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: storePath,
          templateFile: 'plop-templates/store.hbs',
        });
      }

      return actions;
    },
  });

  plop.setGenerator('api-resource', {
    description: 'Cria um novo recurso API',
    prompts: [
      {
        type: 'input',
        name: 'module',
        message: 'Qual o nome do módulo no plural em inglês? (ex: Customers)',
      },
      {
        type: 'input',
        name: 'singular',
        message: 'Qual o nome do módulo no singular em inglês? (ex: Customer)',
      },
      {
        type: 'input',
        name: 'fields',
        message: 'Quais os campos da entidade? (ex: name: string; email: string;)',
      },
    ],
    actions: function (data) {
      const actions = [];
      const resourcePath = `src/composables/api/use${plop.getHelper('pascalCase')(data.module)}Resource.ts`;
      const interfacePath = `src/interfaces/${plop.getHelper('kebabCase')(data.module)}.ts`;

      // Resource
      if (fs.existsSync(resourcePath)) {
        console.log(`\x1b[33mArquivo já existe: ${resourcePath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: resourcePath,
          templateFile: 'plop-templates/composables/api-resource.hbs',
        });
      }

      // Interface
      if (fs.existsSync(interfacePath)) {
        console.log(`\x1b[33mArquivo já existe: ${interfacePath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: interfacePath,
          templateFile: 'plop-templates/interface.hbs',
        });
      }

      return actions;
    },
  });

  plop.setGenerator('dashboard', {
    description: 'Cria uma página de dashboard completa com componentes',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Qual o nome do dashboard? (ex: Sales, Analytics)',
        default: 'Dashboard',
      },
      {
        type: 'input',
        name: 'name_pt',
        message: 'Qual o nome do dashboard em português? (ex: Vendas, Análises)',
        default: 'Dashboard',
      },
    ],
    actions: function (data) {
      const actions = [
        {
          type: 'dashboardDeps',
        },
      ];

      // Caminhos dos arquivos
      const counterCardPath = `src/components/dashboards/${plop.getHelper('kebabCase')(data.name)}/CounterCard.vue`;
      const chartCardPath = `src/components/dashboards/${plop.getHelper('kebabCase')(data.name)}/ChartCard.vue`;
      const tableCardPath = `src/components/dashboards/${plop.getHelper('kebabCase')(data.name)}/TableCard.vue`;
      const apexChartsPath = 'src/boot/apexcharts.ts';
      const dashboardPagePath = `src/pages/dashboards/${plop.getHelper('pascalCase')(data.name)}Dashboard.vue`;

      // Counter Card
      if (fs.existsSync(counterCardPath)) {
        console.log(`\x1b[33mArquivo já existe: ${counterCardPath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: counterCardPath,
          templateFile: 'plop-templates/dashboard-components/counter-card.hbs',
        });
      }

      // Chart Card
      if (fs.existsSync(chartCardPath)) {
        console.log(`\x1b[33mArquivo já existe: ${chartCardPath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: chartCardPath,
          templateFile: 'plop-templates/dashboard-components/chart-card.hbs',
        });
      }

      // Table Card
      if (fs.existsSync(tableCardPath)) {
        console.log(`\x1b[33mArquivo já existe: ${tableCardPath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: tableCardPath,
          templateFile: 'plop-templates/dashboard-components/table-card.hbs',
        });
      }

      // ApexCharts Plugin
      if (fs.existsSync(apexChartsPath)) {
        console.log(`\x1b[33mArquivo já existe: ${apexChartsPath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: apexChartsPath,
          templateFile: 'plop-templates/dashboard-components/apex-charts-plugin.hbs',
        });
      }

      // Dashboard Page
      if (fs.existsSync(dashboardPagePath)) {
        console.log(`\x1b[33mArquivo já existe: ${dashboardPagePath}\x1b[0m`);
      } else {
        actions.push({
          type: 'add',
          path: dashboardPagePath,
          templateFile: 'plop-templates/dashboard-page.hbs',
        });
      }

      return actions;
    },
  });

  plop.setGenerator('kanban', {
    description: 'Gerador de componentes Kanban',
    prompts: [],
    actions: function () {
      const actions = [];
      const files = [
        {
          path: 'src/interfaces/kanban.ts',
          template: 'plop-templates/kanban/kanban.hbs',
        },
        {
          path: 'src/components/kanban/KanbanBoard.vue',
          template: 'plop-templates/kanban/kanban-board.hbs',
        },
        {
          path: 'src/components/kanban/KanbanCard.vue',
          template: 'plop-templates/kanban/kanban-card.hbs',
        },
        {
          path: 'src/components/kanban/KanbanCardDetails.vue',
          template: 'plop-templates/kanban/kanban-card-details.hbs',
        },
        {
          path: 'src/components/kanban/KanbanColumn.vue',
          template: 'plop-templates/kanban/kanban-column.hbs',
        },
        {
          path: 'src/components/kanban/KanbanBoard.vue',
          template: 'plop-templates/kanban/kanban-board.hbs',
        },
      ];

      // Adiciona cada arquivo à lista de ações
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          console.log(`\x1b[33mArquivo já existe: ${file.path}\x1b[0m`);
        } else {
          actions.push({
            type: 'add',
            path: file.path,
            templateFile: file.template,
          });
        }
      });

      return actions;
    },
  });

  plop.setActionType('calendarDeps', function () {
    return new Promise((resolve, reject) => {
      try {
        // Dependências para dashboard
        console.log('Instalando dependências para calendário...');
        execSync(
          'npm install --save @fullcalendar/core @fullcalendar/daygrid @fullcalendar/interaction @fullcalendar/list @fullcalendar/timegrid @fullcalendar/vue3',
        );
        console.log('Dependências instaladas com sucesso!');

        resolve();
      } catch (error) {
        console.error('Erro ao instalar dependências:', error);
        reject(error);
      }
    });
  });

  plop.setGenerator('calendar', {
    description: 'Gerador de componentes de calendário',
    prompts: [],
    actions: function () {
      const actions = [
        {
          type: 'calendarDeps',
        },
      ];

      const files = [
        {
          path: 'src/interfaces/calendar-items.ts',
          template: 'plop-templates/calendar/calendar-items.hbs',
        },
        {
          path: 'src/composables/useCalendar.ts',
          template: 'plop-templates/calendar/use-calendar.hbs',
        },
        {
          path: 'src/components/calendar/CalendarComponent.vue',
          template: 'plop-templates/calendar/calendar-component.hbs',
        },
        {
          path: 'src/pages/calendar/CalendarPage.vue',
          template: 'plop-templates/calendar/calendar-page.hbs',
        },
        {
          path: 'src/css/calendar.scss',
          template: 'plop-templates/calendar/calendar.scss',
        },
      ];

      // Adiciona cada arquivo à lista de ações
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          console.log(`\x1b[33mArquivo já existe: ${file.path}\x1b[0m`);
        } else {
          actions.push({
            type: 'add',
            path: file.path,
            templateFile: file.template,
          });
        }
      });

      return actions;
    },
  });

  plop.setActionType('richeditorDeps', function () {
    return new Promise((resolve, reject) => {
      try {
        // Dependências para o Rich Editor
        console.log('Instalando dependências para o Editor Rico...');
        execSync(
          'npm install --save @tiptap/vue-3 @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-image @tiptap/extension-text-align @tiptap/extension-placeholder @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-header @tiptap/extension-table-cell @tiptap/extension-task-list @tiptap/extension-task-item tippy.js',
        );
        console.log('Dependências instaladas com sucesso!');

        resolve();
      } catch (error) {
        console.error('Erro ao instalar dependências:', error);
        reject(error);
      }
    });
  });

  plop.setGenerator('richeditor', {
    description: 'Gerador do componente de Editor Rico (WYSIWYG)',
    prompts: [],
    actions: function () {
      const actions = [
        {
          type: 'richeditorDeps',
        },
      ];

      const files = [
        {
          path: 'src/components/shared/inputs/RichEditor.vue',
          template: 'plop-templates/richeditor/rich-editor.hbs',
        },
      ];

      // Adiciona cada arquivo à lista de ações
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          console.log(`\x1b[33mArquivo já existe: ${file.path}\x1b[0m`);
        } else {
          actions.push({
            type: 'add',
            path: file.path,
            templateFile: file.template,
          });
        }
      });

      return actions;
    },
  });

  plop.setGenerator('loader-banner', {
    description: 'Gerador do componente LoaderBanner',
    prompts: [],
    actions: function () {
      const actions = [];

      const files = [
        {
          path: 'src/components/shared/loaders/LoaderBanner.vue',
          template: 'plop-templates/loader/loader-banner.hbs',
        },
      ];

      // Adiciona cada arquivo à lista de ações
      files.forEach((file) => {
        if (fs.existsSync(file.path)) {
          console.log(`\x1b[33mArquivo já existe: ${file.path}\x1b[0m`);
        } else {
          actions.push({
            type: 'add',
            path: file.path,
            templateFile: file.template,
          });
        }
      });

      return actions;
    },
  });

  plop.setGenerator('composable', {
    description: 'Cria um composable individual',
    prompts: [
      {
        type: 'list',
        name: 'name',
        message: 'Qual composable deseja gerar?',
        choices: [
          { name: 'useClipboard - Copiar para clipboard', value: 'clipboard' },
          { name: 'useCurrency - Formatação de moeda', value: 'currency' },
          { name: 'useDate - Formatação de datas', value: 'date' },
          { name: 'useDownload - Funções para downloads', value: 'download' },
          { name: 'useFiles - Manipulação de arquivos', value: 'files' },
          { name: 'useHandleException - Tratamento de exceções', value: 'handle-exception' },
          { name: 'useMask - Máscaras de input', value: 'mask' },
          { name: 'useOptions - Opções e seletores', value: 'options' },
          { name: 'useValidation - Validações de formulário', value: 'validation' },
        ],
      },
    ],
    actions: function (data) {
      let composableName = '';
      let templateName = '';

      switch (data.name) {
        case 'clipboard':
          composableName = 'useClipboard';
          templateName = 'use-clipboard';
          break;
        case 'currency':
          composableName = 'useCurrency';
          templateName = 'use-currency';
          break;
        case 'date':
          composableName = 'useDate';
          templateName = 'use-date';
          break;
        case 'download':
          composableName = 'useDownload';
          templateName = 'use-download';
          break;
        case 'files':
          composableName = 'useFiles';
          templateName = 'use-files';
          break;
        case 'handle-exception':
          composableName = 'useHandleException';
          templateName = 'use-handle-exception';
          break;
        case 'mask':
          composableName = 'useMask';
          templateName = 'use-mask';
          break;
        case 'options':
          composableName = 'useOptions';
          templateName = 'use-options';
          break;
        case 'validation':
          composableName = 'useValidation';
          templateName = 'use-validation';
          break;
      }

      const path = `src/composables/${composableName}.ts`;

      if (fs.existsSync(path)) {
        console.log(`\x1b[33mArquivo já existe: ${path}\x1b[0m`);
        return [];
      }

      return [
        {
          type: 'add',
          path: path,
          templateFile: `plop-templates/composables/${templateName}.hbs`,
        },
      ];
    },
  });
}
