import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import sql from '@/lib/db'
import { reqComoComum, reqSemSessao } from '@/tests/helpers'
import { GET } from '@/app/api/consulta/route'

const CPF_TESTE = '55566677788'
// Sem dígitos de propósito — a rota trata qualquer busca com número como
// busca por CPF, então um nome com timestamp embutido quebraria esse teste.
const NOME_TESTE = 'Fulano Teste Consulta Por Nome'

function url(query = '') {
  return `http://localhost/api/consulta${query}`
}

beforeAll(async () => {
  await sql`
    INSERT INTO entrevistas_desligamento (cpf, nome, bp_responsavel, motivo_saida, entrevista_realizada)
    VALUES (${CPF_TESTE}, ${NOME_TESTE}, 'BP de Teste', 'Pedido de demissão', 'nao_recusou')
  `
})

afterAll(async () => {
  await sql`DELETE FROM entrevistas_desligamento WHERE cpf = ${CPF_TESTE}`
  await sql.end()
})

describe('GET /api/consulta', () => {
  it('rejeita sem sessão (401)', async () => {
    const res = await GET(reqSemSessao(url()))
    expect(res.status).toBe(401)
  })

  it('lista todas as entrevistas quando não há busca', async () => {
    const res = await GET(await reqComoComum(url()))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.entrevistas.some((e: { cpf: string }) => e.cpf === CPF_TESTE)).toBe(true)
  })

  it('busca por CPF', async () => {
    const res = await GET(await reqComoComum(url(`?q=${CPF_TESTE}`)))
    const json = await res.json()
    expect(json.entrevistas.every((e: { cpf: string }) => e.cpf.includes(CPF_TESTE))).toBe(true)
    expect(json.entrevistas.length).toBeGreaterThan(0)
  })

  it('busca por nome', async () => {
    const res = await GET(await reqComoComum(url(`?q=${encodeURIComponent(NOME_TESTE)}`)))
    const json = await res.json()
    expect(json.entrevistas.some((e: { nome: string }) => e.nome === NOME_TESTE)).toBe(true)
  })
})
