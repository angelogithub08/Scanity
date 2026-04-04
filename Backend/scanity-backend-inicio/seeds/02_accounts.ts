import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const accounts = [
    {
      id: uuidv4(),
      name: 'Contabilidade ABC',
      email: 'contato@contabilidadeabc.com.br',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Escritório São Paulo',
      email: 'admin@escritoriosp.com.br',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Contabilidade Digital',
      email: 'suporte@contabilidadedigital.com.br',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('accounts').insert(accounts);
}
