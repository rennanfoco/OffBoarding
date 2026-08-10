// Teste de integração — chama a rota de verdade (função POST exportada) e
// bate num Postgres real (o de tests/setup.ts + .env.test), sem subir servidor.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import sql from '@/lib/db'
import { POST } from '@/app/api/auth/login/route'

const USUARIO_TESTE = `teste_login_${Date.now()}`
const SENHA_TESTE = 'senha123'

function postJson(body: unknown) {
  return new NextRequest('http://localhost/api/auth/login', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
}

beforeAll(async () => {
  const senhaHash = await bcrypt.hash(SENHA_TESTE, 10)
  await sql`
    INSERT INTO usuarios (usuario, nome, senha_hash, role)
    VALUES (${USUARIO_TESTE}, 'Usuário de Teste', ${senhaHash}, 'comum')
  `
})

afterAll(async () => {
  await sql`DELETE FROM usuarios WHERE usuario = ${USUARIO_TESTE}`
  await sql.end()
})

describe('POST /api/auth/login', () => {
  it('loga com sucesso e seta o cookie de sessão', async () => {
    const res = await POST(postJson({ usuario: USUARIO_TESTE, senha: SENHA_TESTE }))
    expect(res.status).toBe(200)
    expect(res.headers.get('set-cookie')).toContain('session=')
  })

  it('rejeita senha errada', async () => {
    const res = await POST(postJson({ usuario: USUARIO_TESTE, senha: 'senha-errada' }))
    expect(res.status).toBe(401)
  })

  it('rejeita usuário inexistente', async () => {
    const res = await POST(postJson({ usuario: `nao-existe-${Date.now()}`, senha: 'qualquer' }))
    expect(res.status).toBe(401)
  })

  it('rejeita corpo sem senha (validação Zod)', async () => {
    const res = await POST(postJson({ usuario: USUARIO_TESTE }))
    expect(res.status).toBe(400)
  })

  it('rejeita JSON inválido', async () => {
    const req = new NextRequest('http://localhost/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    'isso não é JSON',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('bloqueia (429) depois de muitas tentativas seguidas contra a mesma conta', async () => {
    // Usuário próprio, isolado dos outros testes deste arquivo — o limite é
    // por chave (ip+usuário), não importa se a conta existe de verdade.
    const usuarioAlvo = `rate-limit-teste-${Date.now()}`

    for (let i = 0; i < 5; i++) {
      const res = await POST(postJson({ usuario: usuarioAlvo, senha: 'errada' }))
      expect(res.status).toBe(401)
    }

    const bloqueado = await POST(postJson({ usuario: usuarioAlvo, senha: 'errada' }))
    expect(bloqueado.status).toBe(429)
    expect(bloqueado.headers.get('retry-after')).toBeTruthy()
  })
})
