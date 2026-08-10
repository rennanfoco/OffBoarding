import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'
import { reqComSessao, reqSemSessao, jsonBody } from '@/tests/helpers'
import { GET, PUT } from '@/app/api/auth/me/route'

const URL = 'http://localhost/api/auth/me'
const USUARIO_TESTE = `teste_me_${Date.now()}`
const SENHA_INICIAL = 'senha123456'

let uid: string

function reqDoUsuario(init: object = {}) {
  return reqComSessao(
    { uid, usuario: USUARIO_TESTE, nome: 'Usuário Teste Me', role: 'comum', is_business_partner: true },
    URL,
    init
  )
}

beforeAll(async () => {
  const senhaHash = await bcrypt.hash(SENHA_INICIAL, 10)
  const [row] = await sql`
    INSERT INTO usuarios (usuario, nome, senha_hash, role, is_business_partner)
    VALUES (${USUARIO_TESTE}, 'Usuário Teste Me', ${senhaHash}, 'comum', true)
    RETURNING id
  `
  uid = row.id
})

afterAll(async () => {
  await sql`DELETE FROM usuarios WHERE usuario = ${USUARIO_TESTE}`
  await sql.end()
})

describe('GET /api/auth/me', () => {
  it('rejeita sem sessão (401)', async () => {
    const res = await GET(reqSemSessao(URL))
    expect(res.status).toBe(401)
  })

  it('retorna os dados da sessão', async () => {
    const res = await GET(await reqDoUsuario())
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({
      usuario:             USUARIO_TESTE,
      nome:                'Usuário Teste Me',
      role:                'comum',
      is_business_partner: true,
    })
  })
})

describe('PUT /api/auth/me (troca de senha)', () => {
  it('rejeita sem sessão (401)', async () => {
    const req = reqSemSessao(URL, { method: 'PUT', ...jsonBody({ senhaAtual: 'x', senhaNova: 'novasenha123' }) })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it('rejeita senha nova curta (422)', async () => {
    const req = await reqDoUsuario({ method: 'PUT', ...jsonBody({ senhaAtual: SENHA_INICIAL, senhaNova: '123' }) })
    const res = await PUT(req)
    expect(res.status).toBe(422)
  })

  it('rejeita senha atual incorreta (401)', async () => {
    const req = await reqDoUsuario({ method: 'PUT', ...jsonBody({ senhaAtual: 'senha-errada', senhaNova: 'novasenha123' }) })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })

  it('troca a senha com sucesso e a senha antiga deixa de funcionar', async () => {
    const req = await reqDoUsuario({ method: 'PUT', ...jsonBody({ senhaAtual: SENHA_INICIAL, senhaNova: 'novasenha123' }) })
    const res = await PUT(req)
    expect(res.status).toBe(200)

    const [user] = await sql`SELECT senha_hash FROM usuarios WHERE id = ${uid}`
    expect(await bcrypt.compare('novasenha123', user.senha_hash)).toBe(true)
    expect(await bcrypt.compare(SENHA_INICIAL, user.senha_hash)).toBe(false)
  })
})
