import { describe, it, expect, afterAll } from 'vitest'
import sql from '@/lib/db'
import { reqComoComum, reqComoBP, reqSemSessao, jsonBody } from '@/tests/helpers'
import { POST } from '@/app/api/entrevista/route'

const URL = 'http://localhost/api/entrevista'
const CPF_TESTE = '11122233344'

const PAYLOAD_MINIMO = {
  cpf: CPF_TESTE,
  nome: 'Ex-colaborador Teste',
  motivo_saida: 'Pedido de demissão',
  entrevista_realizada: 'nao_recusou',
}

afterAll(async () => {
  await sql`DELETE FROM entrevistas_desligamento WHERE cpf = ${CPF_TESTE}`
  await sql.end()
})

describe('POST /api/entrevista', () => {
  it('rejeita sem sessão (401)', async () => {
    const req = reqSemSessao(URL, { method: 'POST', ...jsonBody(PAYLOAD_MINIMO) })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejeita usuário logado sem a marcação de Business Partner (403)', async () => {
    const req = await reqComoComum(URL, { method: 'POST', ...jsonBody(PAYLOAD_MINIMO) })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('ignora um bp_responsavel forjado no corpo e usa o nome da sessão', async () => {
    const req = await reqComoBP(URL, {
      method: 'POST',
      ...jsonBody({ ...PAYLOAD_MINIMO, bp_responsavel: 'Nome Forjado' }),
    }, 'bp-de-teste', 'Nome Verdadeiro Do BP')

    const res = await POST(req)
    expect(res.status).toBe(201)

    const [salvo] = await sql`SELECT bp_responsavel FROM entrevistas_desligamento WHERE cpf = ${CPF_TESTE}`
    expect(salvo.bp_responsavel).toBe('Nome Verdadeiro Do BP')
    expect(salvo.bp_responsavel).not.toBe('Nome Forjado')
  })
})
