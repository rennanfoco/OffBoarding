import { describe, it, expect, afterEach, afterAll } from 'vitest'
import sql from '@/lib/db'
import { bootstrapAdmin } from '@/lib/bootstrap-admin'

const USUARIO = `bootstrap_teste_${Date.now()}`

afterEach(async () => {
  await sql`DELETE FROM usuarios WHERE usuario = ${USUARIO}`
  delete process.env.BOOTSTRAP_ADMIN_USERNAME
  delete process.env.BOOTSTRAP_ADMIN_PASSWORD
})

afterAll(async () => {
  await sql.end()
})

describe('bootstrapAdmin', () => {
  it('não faz nada se as variáveis de ambiente não estiverem configuradas', async () => {
    await bootstrapAdmin()
    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM usuarios WHERE usuario = ${USUARIO}`
    expect(count).toBe(0)
  })

  it('cria o admin quando não existe nenhum admin ainda', async () => {
    process.env.BOOTSTRAP_ADMIN_USERNAME = USUARIO
    process.env.BOOTSTRAP_ADMIN_PASSWORD = 'senha123456'

    await bootstrapAdmin()

    const [criado] = await sql`SELECT usuario, role FROM usuarios WHERE usuario = ${USUARIO}`
    expect(criado).toBeDefined()
    expect(criado.role).toBe('admin')
  })

  it('cria o admin mesmo se já existirem usuários comuns, desde que não haja nenhum admin', async () => {
    // simula o estado "travado": só sobrou usuário comum, nenhum admin
    const outroComum = `${USUARIO}_comum`
    await sql`INSERT INTO usuarios (usuario, nome, senha_hash, role) VALUES (${outroComum}, 'Usuário Comum', 'hash-fake', 'comum')`

    process.env.BOOTSTRAP_ADMIN_USERNAME = USUARIO
    process.env.BOOTSTRAP_ADMIN_PASSWORD = 'senha123456'
    await bootstrapAdmin()

    const [criado] = await sql`SELECT role FROM usuarios WHERE usuario = ${USUARIO}`
    expect(criado?.role).toBe('admin') // criou normalmente, porque não havia admin nenhum

    await sql`DELETE FROM usuarios WHERE usuario = ${outroComum}`
  })

  it('não sobrescreve nem duplica se já existir algum admin', async () => {
    const adminExistente = `${USUARIO}_admin_existente`
    await sql`INSERT INTO usuarios (usuario, nome, senha_hash, role) VALUES (${adminExistente}, 'Admin Existente', 'hash-fake', 'admin')`

    process.env.BOOTSTRAP_ADMIN_USERNAME = USUARIO
    process.env.BOOTSTRAP_ADMIN_PASSWORD = 'senha123456'
    await bootstrapAdmin()

    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM usuarios WHERE usuario = ${USUARIO}`
    expect(count).toBe(0) // não criou, porque já havia um admin

    await sql`DELETE FROM usuarios WHERE usuario = ${adminExistente}`
  })
})
