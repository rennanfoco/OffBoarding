import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import sql from '@/lib/db'
import { reqComoAdmin, reqComoEditor, reqComoComum, reqSemSessao } from '@/tests/helpers'
import { GET } from '@/app/api/exclusoes/route'

const URL = 'http://localhost/api/exclusoes'
const NOME_TESTE = `Excluído de Teste ${Date.now()}`

beforeAll(async () => {
  await sql`
    INSERT INTO entrevistas_excluidas (entrevista_id, nome, cpf_mascarado, excluido_por)
    VALUES (gen_random_uuid(), ${NOME_TESTE}, '111.222.***.44', 'Alguém de Teste')
  `
})

afterAll(async () => {
  await sql`DELETE FROM entrevistas_excluidas WHERE nome = ${NOME_TESTE}`
  await sql.end()
})

describe('GET /api/exclusoes', () => {
  it('rejeita sem sessão (401)', async () => {
    const res = await GET(reqSemSessao(URL))
    expect(res.status).toBe(401)
  })

  it('rejeita usuário comum (403)', async () => {
    const res = await GET(await reqComoComum(URL))
    expect(res.status).toBe(403)
  })

  it('rejeita editor (403) — o log é auditoria de quem pode excluir, só admin lê', async () => {
    const res = await GET(await reqComoEditor(URL))
    expect(res.status).toBe(403)
  })

  it('admin recebe o log, sem nenhum CPF inteiro', async () => {
    const res = await GET(await reqComoAdmin(URL))
    expect(res.status).toBe(200)
    const { exclusoes } = await res.json()

    const nossa = exclusoes.find((x: { nome: string }) => x.nome === NOME_TESTE)
    expect(nossa.excluido_por).toBe('Alguém de Teste')
    expect(nossa.cpf_mascarado).toBe('111.222.***.44')
    expect(nossa).not.toHaveProperty('cpf')
  })
})
