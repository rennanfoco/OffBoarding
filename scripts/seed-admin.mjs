// Cria (ou reseta a senha de) o primeiro usuário administrador.
//
// Uso (lê DATABASE_URL de .env.local automaticamente, se existir):
//   node scripts/seed-admin.mjs usuario senha123
//
// Ou apontando pra outro banco (ex: produção), sem depender do .env.local:
//   DATABASE_URL="postgresql://usuario:senha@host:5432/offboarding" \
//     node scripts/seed-admin.mjs usuario senha123
//
// Idempotente: rodar de novo com o mesmo "usuario" só atualiza senha/role.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'

// node não carrega .env.local sozinho (isso é um recurso do Next.js, não da
// linguagem) — carregamos manualmente aqui, sem sobrescrever variáveis que
// já vieram do ambiente (ex: docker-compose ou export manual).
function carregarEnvLocal() {
  const raizDoProjeto = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
  const envPath = path.join(raizDoProjeto, '.env.local')
  let conteudo
  try {
    conteudo = readFileSync(envPath, 'utf-8')
  } catch {
    return // sem .env.local, segue só com o que já estiver no ambiente
  }
  for (const linha of conteudo.split('\n')) {
    const match = linha.match(/^([A-Z0-9_]+)=(.*)$/i)
    if (!match) continue
    const [, chave, valor] = match
    if (process.env[chave] === undefined) {
      process.env[chave] = valor.trim()
    }
  }
}

carregarEnvLocal()

const [, , usuario, senha] = process.argv

if (!usuario || !senha) {
  console.error('Uso: node scripts/seed-admin.mjs usuario senha')
  process.exit(1)
}

if (senha.length < 6) {
  console.error('A senha deve ter pelo menos 6 caracteres.')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('Defina a variável DATABASE_URL antes de rodar o script.')
  process.exit(1)
}

const sql = postgres(process.env.DATABASE_URL)

try {
  const senhaHash = await bcrypt.hash(senha, 10)

  // nome não é coletado separadamente aqui — usa o próprio usuário como nome
  // (só é usado na criação; se já existir, o nome atual não é sobrescrito).
  await sql`
    INSERT INTO usuarios (usuario, nome, senha_hash, role)
    VALUES (${usuario}, ${usuario}, ${senhaHash}, 'admin')
    ON CONFLICT (usuario) DO UPDATE
      SET senha_hash = EXCLUDED.senha_hash, role = 'admin'
  `

  console.log(`Administrador "${usuario}" criado/atualizado com sucesso.`)
} finally {
  await sql.end()
}
