import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  const accounts = await knex('accounts').select('id', 'name');
  const saltRounds = 10;

  const users = [
    {
      id: uuidv4(),
      name: 'João Silva',
      email: 'joao@exemple.com',
      password: await bcrypt.hash('123456', saltRounds),
      token: null,
      account_id: accounts[0]?.id,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Maria Santos',
      email: 'maria@exemple.com',
      password: await bcrypt.hash('123456', saltRounds),
      token: null,
      account_id: accounts[1]?.id,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Pedro Costa',
      email: 'pedro@exemple.com',
      password: await bcrypt.hash('123456', saltRounds),
      token: null,
      account_id: accounts[2]?.id,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Ana Oliveira',
      email: 'ana@contabilidadeabc.com.br',
      password: await bcrypt.hash('123456', saltRounds),
      token: null,
      account_id: accounts[0]?.id,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await knex('users').insert(users);
}
