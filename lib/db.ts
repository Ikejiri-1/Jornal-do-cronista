// Conexão com o Postgres (Supabase) como o papel app_rw: sem superusuário, sem DDL.
// DATABASE_URL = pooler em modo transação (porta 6543). Por isso `prepare: false`.
import postgres from 'postgres';

const globalState = globalThis as unknown as { __sql?: postgres.Sql };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não definida.');
  // fetch_types: false evita uma consulta extra ao catálogo na primeira conexão (o app não usa colunas de lista).
  // max_pipeline 1: o pooler em modo transação trava com várias consultas enviadas em sequência na mesma conexão.
  // max 3: cada função serverless abre pouca conexão; o pooler do Supabase junta o resto.
  // DATABASE_SSL=off só para o Postgres local de teste; em produção segue 'require'.
  const options = { ssl: process.env.DATABASE_SSL === 'off' ? false : ('require' as const), max: 3, max_pipeline: 1, prepare: false, fetch_types: false, idle_timeout: 20, connect_timeout: 10 }; // max_pipeline existe no driver, não nos tipos
  return postgres(url, options);
}

export const sql = () => (globalState.__sql ||= connect());

export type Tx = postgres.TransactionSql;

// Violação de constraint nomeada (ex.: users_email_unique) → o chamador traduz para a mensagem certa.
export const constraintOf = (error: unknown) => (error && typeof error === 'object' && 'constraint_name' in error ? String((error as { constraint_name: string }).constraint_name) : '');
