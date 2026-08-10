import { describe, it, expect, afterAll } from 'vitest'
import sql from '@/lib/db'
import { reqComoAdmin, reqComoComum, reqSemSessao, jsonBody } from '@/tests/helpers'
import { GET, POST } from '@/app/api/usuarios/route'

const URL = 'http://localhost/api/usuarios'
const USUARIO_CRIADO = `teste_criado_${Date.now()}`

afterAll(async () => {
  await sql`DELETE FROM usuarios WHERE usuario = ${USUARIO_CRIADO}`
  await sql.end()
})

describe('GET /api/usuarios', () => {
  it('rejeita sem sessão (401)', async () => {
    const res = await GET(reqSemSessao(URL))
    expect(res.status).toBe(401)
  })

  it('rejeita usuário comum (403)', async () => {
    const res = await GET(await reqComoComum(URL))
    expect(res.status).toBe(403)
  })

  it('lista usuários para admin, sem expor senha_hash', async () => {
    const res = await GET(await reqComoAdmin(URL))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.usuarios)).toBe(true)
    for (const u of json.usuarios) {
      expect(u).not.toHaveProperty('senha_hash')
    }
  })
})

describe('POST /api/usuarios', () => {
  it('rejeita usuário comum (403)', async () => {
    const req = await reqComoComum(URL, { method: 'POST', ...jsonBody({ usuario: 'x', nome: 'X', senha: 'senha123', role: 'comum' }) })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('rejeita senha curta (422)', async () => {
    const req = await reqComoAdmin(URL, { method: 'POST', ...jsonBody({ usuario: USUARIO_CRIADO, nome: 'Teste Criado', senha: '123', role: 'comum' }) })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('rejeita sem nome (422)', async () => {
    const req = await reqComoAdmin(URL, { method: 'POST', ...jsonBody({ usuario: `${USUARIO_CRIADO}_sem_nome`, senha: 'senha123', role: 'comum' }) })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('admin cria um usuário com sucesso, marcado como Business Partner', async () => {
    const req = await reqComoAdmin(URL, { method: 'POST', ...jsonBody({
      usuario: USUARIO_CRIADO, nome: 'Teste Criado', senha: 'senha123', role: 'comum', is_business_partner: true,
    }) })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.usuario.usuario).toBe(USUARIO_CRIADO)
    expect(json.usuario.nome).toBe('Teste Criado')
    expect(json.usuario.is_business_partner).toBe(true)
    expect(json.usuario).not.toHaveProperty('senha_hash')
  })

  it('rejeita usuário duplicado (409)', async () => {
    const req = await reqComoAdmin(URL, { method: 'POST', ...jsonBody({ usuario: USUARIO_CRIADO, nome: 'Teste Criado', senha: 'senha123', role: 'comum' }) })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })
})
