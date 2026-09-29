import { describe, it, expect, afterAll } from 'vitest'
import sql from '@/lib/db'
import { aplicarMigrations } from '@/lib/migrate'

afterAll(async () => {
  await sql.end()
})

describe('aplicarMigrations', () => {
  it('aplica sem erro mesmo num banco que já tem o schema completo (idempotente)', async () => {
    await aplicarMigrations()
    const aplicadas = await sql`SELECT nome_arquivo FROM migracoes_aplicadas`
    expect(aplicadas.length).toBeGreaterThanOrEqual(3)
  })

  it('rodar de novo não falha nem duplica nada', async () => {
    await aplicarMigrations()
    const aplicadas = await sql`SELECT nome_arquivo FROM migracoes_aplicadas`
    const nomes = aplicadas.map((a) => a.nome_arquivo as string)
    expect(new Set(nomes).size).toBe(nomes.length)
  })
})
