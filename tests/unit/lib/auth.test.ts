// Testes unitários — nenhuma rede nem banco envolvidos aqui, só a lógica
// de assinar/verificar o cookie de sessão em memória.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { criarSessao, lerSessao, verificarSessao, verificarSessaoAdmin, verificarSessaoBP, type Sessao } from '@/lib/auth'

function reqComCookie(cookieValue?: string) {
  const headers = new Headers()
  if (cookieValue) headers.set('cookie', `session=${cookieValue}`)
  return new NextRequest('http://localhost/teste', { headers })
}

const SESSAO_TESTE: Sessao = { uid: 'user-1', usuario: 'joao', nome: 'João', role: 'comum', is_business_partner: false }

beforeEach(() => {
  process.env.AUTH_SECRET = 'segredo-de-teste'
})

describe('criarSessao + lerSessao', () => {
  it('cria e lê uma sessão válida (ida e volta)', async () => {
    const cookie = await criarSessao(SESSAO_TESTE)
    expect(cookie).not.toBeNull()

    const sessao = await lerSessao(reqComCookie(cookie!))
    expect(sessao).toEqual(SESSAO_TESTE)
  })

  it('retorna null sem cookie nenhum', async () => {
    expect(await lerSessao(reqComCookie())).toBeNull()
  })

  it('retorna null se o cookie foi adulterado', async () => {
    const cookie = await criarSessao(SESSAO_TESTE)
    // troca os últimos caracteres da assinatura — payload continua "válido"
    // na aparência, mas a assinatura não bate mais
    const adulterado = cookie!.slice(0, -4) + 'aaaa'

    expect(await lerSessao(reqComCookie(adulterado))).toBeNull()
  })

  it('retorna null para um cookie sem o formato payload.assinatura', async () => {
    expect(await lerSessao(reqComCookie('nao-e-um-jwt'))).toBeNull()
  })

  it('retorna null se a sessão já expirou', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2020-01-01T00:00:00Z'))
    const cookie = await criarSessao(SESSAO_TESTE) // expira em +8h

    vi.setSystemTime(new Date('2020-01-02T00:00:00Z')) // 1 dia depois
    const sessao = await lerSessao(reqComCookie(cookie!))

    vi.useRealTimers()
    expect(sessao).toBeNull()
  })

  it('criarSessao retorna null se AUTH_SECRET não estiver configurado', async () => {
    delete process.env.AUTH_SECRET
    expect(await criarSessao(SESSAO_TESTE)).toBeNull()
  })
})

describe('verificarSessao', () => {
  it('retorna null (autorizado) quando a sessão é válida', async () => {
    const cookie = await criarSessao(SESSAO_TESTE)
    expect(await verificarSessao(reqComCookie(cookie!))).toBeNull()
  })

  it('retorna 401 sem sessão', async () => {
    const resposta = await verificarSessao(reqComCookie())
    expect(resposta?.status).toBe(401)
  })
})

describe('verificarSessaoAdmin', () => {
  it('retorna null (autorizado) para admin', async () => {
    const cookie = await criarSessao({ ...SESSAO_TESTE, role: 'admin' })
    expect(await verificarSessaoAdmin(reqComCookie(cookie!))).toBeNull()
  })

  it('retorna 403 para usuário comum', async () => {
    const cookie = await criarSessao(SESSAO_TESTE) // role: comum
    const resposta = await verificarSessaoAdmin(reqComCookie(cookie!))
    expect(resposta?.status).toBe(403)
  })

  it('retorna 401 sem sessão', async () => {
    const resposta = await verificarSessaoAdmin(reqComCookie())
    expect(resposta?.status).toBe(401)
  })
})

describe('verificarSessaoBP', () => {
  it('retorna null (autorizado) para quem tem a marcação de Business Partner', async () => {
    const cookie = await criarSessao({ ...SESSAO_TESTE, is_business_partner: true })
    expect(await verificarSessaoBP(reqComCookie(cookie!))).toBeNull()
  })

  it('retorna 403 para quem não tem a marcação', async () => {
    const cookie = await criarSessao(SESSAO_TESTE) // is_business_partner: false
    const resposta = await verificarSessaoBP(reqComCookie(cookie!))
    expect(resposta?.status).toBe(403)
  })

  it('retorna 401 sem sessão', async () => {
    const resposta = await verificarSessaoBP(reqComCookie())
    expect(resposta?.status).toBe(401)
  })
})
