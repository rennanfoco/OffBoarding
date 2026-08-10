// Helpers compartilhados pelos testes de integração das rotas de API.
import { NextRequest } from 'next/server'
import { criarSessao, type Sessao } from '@/lib/auth'

// Tipo exato que o construtor de NextRequest espera (diverge um pouco do
// RequestInit padrão do DOM no campo `signal`).
type NextReqInit = NonNullable<ConstructorParameters<typeof NextRequest>[1]>

/** Constrói um NextRequest autenticado com a sessão informada (cookie assinado de verdade). */
export async function reqComSessao(sessao: Sessao, url: string, init: NextReqInit = {}) {
  const headers = new Headers(init.headers)
  const cookie = await criarSessao(sessao)
  headers.set('cookie', `session=${cookie}`)
  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  return new NextRequest(url, { ...init, headers })
}

export function reqComoAdmin(url: string, init: NextReqInit = {}, uid = 'admin-de-teste') {
  return reqComSessao({ uid, usuario: 'admin_teste', nome: 'Admin de Teste', role: 'admin', is_business_partner: false }, url, init)
}

export function reqComoComum(url: string, init: NextReqInit = {}, uid = 'comum-de-teste') {
  return reqComSessao({ uid, usuario: 'comum_teste', nome: 'Comum de Teste', role: 'comum', is_business_partner: false }, url, init)
}

export function reqComoBP(url: string, init: NextReqInit = {}, uid = 'bp-de-teste', nome = 'BP de Teste') {
  return reqComSessao({ uid, usuario: 'bp_teste', nome, role: 'comum', is_business_partner: true }, url, init)
}

/** Requisição sem nenhuma sessão (não autenticado). */
export function reqSemSessao(url: string, init: NextReqInit = {}) {
  return new NextRequest(url, init)
}

export function jsonBody(body: unknown): NextReqInit {
  return { body: JSON.stringify(body) }
}
