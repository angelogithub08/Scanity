import nodePlop from 'node-plop';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o equivalente a __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const plop = await nodePlop(path.join(__dirname, 'plopfile.js'));
  const crudGenerator = plop.getGenerator('crud-pages');

  // Lista dos módulos a serem criados, extraídos das tabelas do diagrama ER
  const modules = [
    {
      module: 'MovementStages',
      module_pt: 'Etapas de Movimentação',
      singular: 'MovementStage',
      singular_pt: 'Etapa de Movimento',
      fields: 'name: string; account_id: string',
      columns: '2',
    },
  ];

  for (const mod of modules) {
    console.log(`\nGerando módulo: ${mod.module} (${mod.module_pt})`);
    try {
      await crudGenerator.runActions({
        module: mod.module,
        module_pt: mod.module_pt,
        singular: mod.singular,
        singular_pt: mod.singular_pt,
        fields: mod.fields,
        columns: mod.columns,
      });
      console.log(`✅ Módulo ${mod.module} gerado com sucesso!`);
    } catch (error) {
      console.error(`❌ Erro ao gerar módulo ${mod.module}:`, error);
    }
  }

  console.log('\n🎉 Todos os módulos foram processados!');
})();
