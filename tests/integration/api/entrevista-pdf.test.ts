import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import sql from '@/lib/db'
import { reqComoComum, reqSemSessao } from '@/tests/helpers'
import { GET } from '@/app/api/entrevista/pdf/[id]/route'

const CPF_TESTE = '22233344455'
let idEntrevista: string

function url(id: string) {
  return `http://localhost/api/entrevista/pdf/${id}`
}

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeAll(async () => {
  const [row] = await sql`
    INSERT INTO entrevistas_desligamento (cpf, nome, bp_responsavel, motivo_saida, entrevista_realizada)
    VALUES (${CPF_TESTE}, 'Teste PDF', 'BP de Teste', 'Pedido de demissão', 'nao_recusou')
    RETURNING id
  `
  idEntrevista = row.id
})

afterAll(async () => {
  await sql`DELETE FROM entrevistas_desligamento WHERE cpf = ${CPF_TESTE}`
  await sql.end()
})

describe('GET /api/entrevista/pdf/[id]', () => {
  it('rejeita sem sessão (401)', async () => {
    const res = await GET(reqSemSessao(url(idEntrevista)), paramsFor(idEntrevista))
    expect(res.status).toBe(401)
  })

  it('retorna 404 pra id inexistente', async () => {
    const idFalso = '00000000-0000-0000-0000-000000000000'
    const res = await GET(await reqComoComum(url(idFalso)), paramsFor(idFalso))
    expect(res.status).toBe(404)
  })

  it('gera o PDF com os cabeçalhos corretos', async () => {
    const res = await GET(await reqComoComum(url(idEntrevista)), paramsFor(idEntrevista))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/pdf')
    expect(res.headers.get('content-disposition')).toContain('attachment')
    expect(res.headers.get('content-disposition')).toContain('teste-pdf.pdf')

    const buffer = await res.arrayBuffer()
    expect(buffer.byteLength).toBeGreaterThan(0)
  })
})
