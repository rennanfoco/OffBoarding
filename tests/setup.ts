// Carrega .env.test antes de qualquer teste rodar — precisa acontecer aqui
// (setupFiles) e não dentro de um teste, porque módulos como lib/db.ts leem
// process.env.DATABASE_URL assim que são importados, e os imports de um
// arquivo de teste são resolvidos antes do corpo dos testes rodar.
//
// Mesmo padrão de leitura manual de .env* já usado em scripts/seed-admin.mjs
// (o Node não carrega .env sozinho — isso é um recurso do Next.js).

import { readFileSync } from 'node:fs'
import path from 'node:path'

function carregarEnvTest() {
  const envPath = path.join(process.cwd(), '.env.test')
  let conteudo: string
  try {
    conteudo = readFileSync(envPath, 'utf-8')
  } catch {
    throw new Error(
      'Arquivo .env.test não encontrado. Copie .env.test.example para .env.test antes de rodar os testes.'
    )
  }
  for (const linha of conteudo.split('\n')) {
    const match = linha.match(/^([A-Z0-9_]+)=(.*)$/i)
    if (!match) continue
    const [, chave, valor] = match
    process.env[chave] = valor.trim()
  }
}

carregarEnvTest()
