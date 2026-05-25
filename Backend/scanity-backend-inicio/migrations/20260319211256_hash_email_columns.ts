import type { Knex } from 'knex';
import { createHash } from 'crypto';

const EMAIL_HASH_REGEX = /^[a-f0-9]{64}$/;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashEmail(email: string): string {
  const secret = process.env.EMAIL_HASH_SECRET || process.env.JWT_SECRET || '';
  return createHash('sha256')
    .update(`${secret}:${normalizeEmail(email)}`)
    .digest('hex');
}

async function hashEmailsForTable(
  knex: Knex,
  table: string,
  idColumn = 'id',
): Promise<void> {
  const rows = (await knex(table).select([idColumn, 'email'])) as Array<{
    [key: string]: string | null;
  }>;

  for (const row of rows) {
    const email = row.email;
    const id = row[idColumn];
    if (!email || !id) {
      continue;
    }

    if (EMAIL_HASH_REGEX.test(email)) {
      continue;
    }

    await knex(table)
      .where({ [idColumn]: id })
      .update({ email: hashEmail(email) });
  }
}

export async function up(knex: Knex): Promise<void> {
  await hashEmailsForTable(knex, 'accounts');
  await hashEmailsForTable(knex, 'users');
}

export async function down(): Promise<void> {
  throw new Error(
    'Não é possível reverter hash de e-mails (transformação irreversível).',
  );
}
