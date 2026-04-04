import nodePlop from 'node-plop';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o equivalente a __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const plop = await nodePlop(path.join(__dirname, 'plopfile.js'));
  const moduleGenerator = plop.getGenerator('module');

  // Lista dos módulos a serem criados, baseados no DB.mermaid
  const modules = [
    {
      module: 'MovementStages',
      singular: 'MovementStage',
      fields:
        'name: string [example:"Em análise"]; account_id: string [example:"550e8400-e29b-41d4-a716-446655440001"]',
    },
  ];

  for (const mod of modules) {
    console.log(`\nGerando módulo: ${mod.module}`);
    await moduleGenerator.runActions({
      module: mod.module,
      singular: mod.singular,
      fields: mod.fields,
    });
  }

  console.log('\nTodos os módulos foram gerados!');
})();
