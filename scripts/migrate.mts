/**
 * Cria a estrutura do banco num projeto Supabase novo. Uso: npm run migrate
 * Aplica, em ordem, os arquivos de supabase/migrations no banco de DATABASE_URL (.env.local).
 * Rode uma vez só, num banco vazio.
 */
import postgres from "postgres";
import fs from "node:fs";
import path from "node:path";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada (.env.local).");
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const dir = path.join(process.cwd(), "supabase", "migrations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

const [{ exists }] = await sql`select to_regclass('public.users') is not null as exists`;
if (exists) {
  console.log("O banco já tem a tabela users — nada foi aplicado. (Este comando é só para banco vazio.)");
  await sql.end();
  process.exit(0);
}

for (const f of files) {
  process.stdout.write(`Aplicando ${f}… `);
  await sql.unsafe(fs.readFileSync(path.join(dir, f), "utf8"));
  console.log("ok");
}
console.log(`✔ Estrutura criada (${files.length} arquivos). Agora rode: npm run seed`);
await sql.end();
