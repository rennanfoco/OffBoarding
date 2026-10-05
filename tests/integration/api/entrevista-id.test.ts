import { describe, it, expect, afterAll } from 'vitest'
import sql from '@/lib/db'
import { reqComoAdmin, reqComoComum, reqComoBP, reqComoEditor, reqSemSessao, jsonBody } from '@/tests/helpers'
import { GET, PUT, DELETE } from '@/app/api/entrevista/[id]/route'

const CPF_TESTE = '33344455566'
const BP_ORIGINAL = 'BP Original Da Entrevista'

function url(id: string) {
  return `http://localhost/api/entrevista/${id}`
}

function paramsFor(id: string) {
  return { params: Promise.resolve({ id }) }
}

async function criarEntrevista() {
  const [row] = await sql`
    INSERT INTO entrevistas_desligamento (cpf, nome, bp_responsavel, motivo_saida, entrevista_realizada, parecer_bp)
    VALUES (${CPF_TESTE}, 'Fulano Editável', ${BP_ORIGINAL}, 'Pedido de demissão', 'nao_recusou', 'Parecer original')
    RETURNING id
  `
  return row.id as string
}

afterAll(async () => {
  await sql`DELETE FROM entrevistas_desligamento WHERE cpf = ${CPF_TESTE}`
  await sql`DELETE FROM entrevistas_excluidas WHERE cpf_mascarado = '333.444.***.66'`
  await sql.end()
})

describe('GET /api/entrevista/[id]', () => {
  it('rejeita sem sessão (401)', async () => {
    const id = await criarEntrevista()
    const res = await GET(reqSemSessao(url(id)), paramsFor(id))
    expect(res.status).toBe(401)
  })

  it('rejeita quem não é admin (403)', async () => {
    const id = await criarEntrevista()
    const res = await GET(await reqComoBP(url(id)), paramsFor(id))
    expect(res.status).toBe(403)
  })

  it('retorna 404 pra id inexistente', async () => {
    const idFalso = '00000000-0000-0000-0000-000000000000'
    const res = await GET(await reqComoAdmin(url(idFalso)), paramsFor(idFalso))
    expect(res.status).toBe(404)
  })

  it('editor também recebe os dados (precisa deles pra abrir a tela de edição)', async () => {
    const id = await criarEntrevista()
    const res = await GET(await reqComoEditor(url(id)), paramsFor(id))
    expect(res.status).toBe(200)
  })

  it('admin recebe os dados completos da entrevista', async () => {
    const id = await criarEntrevista()
    const res = await GET(await reqComoAdmin(url(id)), paramsFor(id))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.entrevista.bp_responsavel).toBe(BP_ORIGINAL)
    expect(json.entrevista.parecer_bp).toBe('Parecer original')
  })
})

describe('PUT /api/entrevista/[id]', () => {
  const PAYLOAD_VALIDO = {
    cpf: CPF_TESTE,
    nome: 'Fulano Editável (corrigido)',
    motivo_saida: 'Dispensa sem justa causa',
    entrevista_realizada: 'nao_recusou',
    parecer_bp: 'Parecer atualizado pelo admin',
  }

  it('rejeita sem sessão (401)', async () => {
    const id = await criarEntrevista()
    const req = reqSemSessao(url(id), { method: 'PUT', ...jsonBody(PAYLOAD_VALIDO) })
    const res = await PUT(req, paramsFor(id))
    expect(res.status).toBe(401)
  })

  it('rejeita BP sem ser admin (403)', async () => {
    const id = await criarEntrevista()
    const req = await reqComoBP(url(id), { method: 'PUT', ...jsonBody(PAYLOAD_VALIDO) })
    const res = await PUT(req, paramsFor(id))
    expect(res.status).toBe(403)
  })

  it('rejeita corpo inválido (422)', async () => {
    const id = await criarEntrevista()
    const req = await reqComoAdmin(url(id), { method: 'PUT', ...jsonBody({ cpf: '123' }) })
    const res = await PUT(req, paramsFor(id))
    expect(res.status).toBe(422)
  })

  it('retorna 404 pra id inexistente', async () => {
    const idFalso = '00000000-0000-0000-0000-000000000000'
    const req = await reqComoAdmin(url(idFalso), { method: 'PUT', ...jsonBody(PAYLOAD_VALIDO) })
    const res = await PUT(req, paramsFor(idFalso))
    expect(res.status).toBe(404)
  })

  it('admin edita a entrevista, mas bp_responsavel não muda e fica registrado quem editou', async () => {
    const id = await criarEntrevista()
    const req = await reqComoAdmin(url(id), { method: 'PUT', ...jsonBody(PAYLOAD_VALIDO) })
    const res = await PUT(req, paramsFor(id))
    expect(res.status).toBe(200)

    const [row] = await sql`SELECT * FROM entrevistas_desligamento WHERE id = ${id}`
    expect(row.nome).toBe('Fulano Editável (corrigido)')
    expect(row.parecer_bp).toBe('Parecer atualizado pelo admin')
    expect(row.bp_responsavel).toBe(BP_ORIGINAL) // não foi sobrescrito pelo admin
    expect(row.editado_por).toBe('Admin de Teste') // nome do admin da sessão de teste
    expect(row.editado_em).not.toBeNull()
  })

  it('editor edita a entrevista e fica registrado como quem editou', async () => {
    const id = await criarEntrevista()
    const req = await reqComoEditor(url(id), { method: 'PUT', ...jsonBody(PAYLOAD_VALIDO) })
    const res = await PUT(req, paramsFor(id))
    expect(res.status).toBe(200)

    const [row] = await sql`SELECT editado_por, bp_responsavel FROM entrevistas_desligamento WHERE id = ${id}`
    expect(row.editado_por).toBe('Editor de Teste')
    expect(row.bp_responsavel).toBe(BP_ORIGINAL)
  })

  it('aceita null nas perguntas de escala e no NPS (pergunta sem resposta)', async () => {
    // Um formulário sem nenhuma opção de rádio marcada manda `null`, não
    // `undefined`, pra essas perguntas — cobre o bug encontrado testando a
    // edição manualmente: z.enum(...).optional() sozinho rejeitava null.
    const id = await criarEntrevista()
    const req = await reqComoAdmin(url(id), {
      method: 'PUT',
      ...jsonBody({
        ...PAYLOAD_VALIDO,
        avaliacao_lideranca: null,
        nps: null,
      }),
    })
    const res = await PUT(req, paramsFor(id))
    expect(res.status).toBe(200)

    const [row] = await sql`SELECT avaliacao_lideranca, nps FROM entrevistas_desligamento WHERE id = ${id}`
    expect(row.avaliacao_lideranca).toBeNull()
    expect(row.nps).toBeNull()
  })
})

describe('DELETE /api/entrevista/[id]', () => {
  it('rejeita sem sessão (401)', async () => {
    const id = await criarEntrevista()
    const res = await DELETE(reqSemSessao(url(id)), paramsFor(id))
    expect(res.status).toBe(401)
  })

  it('rejeita quem não é admin (403)', async () => {
    const id = await criarEntrevista()
    const res = await DELETE(await reqComoComum(url(id)), paramsFor(id))
    expect(res.status).toBe(403)
  })

  it('retorna 404 pra id inexistente', async () => {
    const idFalso = '00000000-0000-0000-0000-000000000000'
    const res = await DELETE(await reqComoAdmin(url(idFalso)), paramsFor(idFalso))
    expect(res.status).toBe(404)
  })

  it('admin exclui a entrevista com sucesso e a exclusão fica registrada no log', async () => {
    const id = await criarEntrevista()
    const res = await DELETE(await reqComoAdmin(url(id)), paramsFor(id))
    expect(res.status).toBe(200)

    const [row] = await sql`SELECT id FROM entrevistas_desligamento WHERE id = ${id}`
    expect(row).toBeUndefined()

    const [log] = await sql`SELECT nome, cpf_mascarado, excluido_por FROM entrevistas_excluidas WHERE entrevista_id = ${id}`
    expect(log.nome).toBe('Fulano Editável')
    expect(log.cpf_mascarado).toBe('333.444.***.66') // nunca o CPF inteiro
    expect(log.excluido_por).toBe('Admin de Teste')
  })

  it('editor também exclui, e o log registra o nome do editor', async () => {
    const id = await criarEntrevista()
    const res = await DELETE(await reqComoEditor(url(id)), paramsFor(id))
    expect(res.status).toBe(200)

    const [log] = await sql`SELECT excluido_por FROM entrevistas_excluidas WHERE entrevista_id = ${id}`
    expect(log.excluido_por).toBe('Editor de Teste')
  })

  it('exclusão de id inexistente não grava nada no log', async () => {
    const idFalso = '00000000-0000-0000-0000-000000000001'
    await DELETE(await reqComoAdmin(url(idFalso)), paramsFor(idFalso))
    const linhas = await sql`SELECT id FROM entrevistas_excluidas WHERE entrevista_id = ${idFalso}`
    expect(linhas.length).toBe(0)
  })
})
