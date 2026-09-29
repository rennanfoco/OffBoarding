import { readdirSync } from 'node:fs'
import path from 'node:path'
import sql from './db'

const PASTA_MIGRATIONS = path.join(process.cwd(), 'db', 'migrations')

/**
 * Aplica automaticamente, na ordem do nome do arquivo, toda migração de
 * db/migrations/ que ainda não rodou nesse banco — guardando o que já
 * aplicou numa tabela própria, pra não rodar de novo a cada boot nem
 * depender só da idempotência de cada arquivo (elas já são idempotentes por
 * convenção, mas isso é uma segunda camada de segurança, não a única).
 *
 * Existe pra não precisar rodar `psql -f db/migrations/00X....sql` à mão
 * toda vez que sobe uma versão nova em produção — o próprio app aplica
 * sozinho no boot, antes de aceitar qualquer requisição.
 */
export async function aplicarMigrations() {
  await sql`
    CREATE TABLE IF NOT EXISTS migracoes_aplicadas (
      nome_arquivo TEXT PRIMARY KEY,
      aplicada_em  TIMESTAMPTZ DEFAULT NOW()
    )
  `

  let arquivos: string[]
  try {
    arquivos = readdirSync(PASTA_MIGRATIONS)
      .filter((nome) => nome.endsWith('.sql'))
      .sort()
  } catch {
    return // pasta db/migrations não existe — nada a aplicar
  }

  const linhas = await sql`SELECT nome_arquivo FROM migracoes_aplicadas`
  const jaAplicadas = new Set(linhas.map((l) => l.nome_arquivo as string))

  for (const arquivo of arquivos) {
    if (jaAplicadas.has(arquivo)) continue

    await sql.file(path.join(PASTA_MIGRATIONS, arquivo))
    await sql`INSERT INTO migracoes_aplicadas (nome_arquivo) VALUES (${arquivo})`
    console.log(`[migrate] aplicada: ${arquivo}`)
  }
}
