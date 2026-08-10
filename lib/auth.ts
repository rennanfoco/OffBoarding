import { NextRequest, NextResponse } from 'next/server'

/**
 * Sessão assinada com HMAC-SHA256 (Web Crypto API), guardada num cookie
 * httpOnly. Usa só `crypto.subtle` (sem módulos Node-only) para poder ser
 * lida tanto em rotas de API (Node runtime) quanto no `proxy.ts` (Edge runtime).
 *
 * Cookie: "<payload_base64url>.<assinatura_base64url>"
 * Payload: { uid, usuario, nome, role, is_business_partner, exp } — exp em epoch ms.
 */

export type Role = 'admin' | 'comum'

export type Sessao = {
  uid:                  string
  usuario:              string
  nome:                 string
  role:                 Role
  is_business_partner:  boolean
}

const OITO_HORAS_MS = 8 * 60 * 60 * 1000

function base64urlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + (4 - (str.length % 4)) % 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function getKey(): Promise<CryptoKey | null> {
  const secret = process.env.AUTH_SECRET
  if (!secret) return null
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

/** Gera o valor do cookie de sessão assinado para o usuário informado. */
export async function criarSessao(dados: Sessao): Promise<string | null> {
  const key = await getKey()
  if (!key) return null

  const payload = { ...dados, exp: Date.now() + OITO_HORAS_MS }
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload))
  const payloadB64    = base64urlEncode(payloadBytes)

  const assinatura = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64))
  const assinaturaB64 = base64urlEncode(new Uint8Array(assinatura))

  return `${payloadB64}.${assinaturaB64}`
}

/** Decodifica e valida o cookie de sessão. Retorna `null` se ausente, inválido ou expirado. */
export async function lerSessao(req: NextRequest): Promise<Sessao | null> {
  const cookie = req.cookies.get('session')?.value
  if (!cookie) return null

  const [payloadB64, assinaturaB64] = cookie.split('.')
  if (!payloadB64 || !assinaturaB64) return null

  const key = await getKey()
  if (!key) return null

  try {
    const valido = await crypto.subtle.verify(
      'HMAC',
      key,
      base64urlDecode(assinaturaB64) as BufferSource,
      new TextEncoder().encode(payloadB64)
    )
    if (!valido) return null

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64) as BufferSource))
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null

    return {
      uid:                 payload.uid,
      usuario:             payload.usuario,
      nome:                payload.nome,
      role:                payload.role,
      is_business_partner: payload.is_business_partner,
    }
  } catch {
    return null
  }
}

/**
 * Verifica se a requisição possui uma sessão válida.
 *
 * Retorna `null` se a sessão for válida (pode continuar).
 * Retorna um `NextResponse` com status 401 se não for — basta retornar
 * esse valor direto da rota.
 *
 * Uso em qualquer rota de API:
 *   const auth = await verificarSessao(req)
 *   if (auth) return auth
 */
export async function verificarSessao(req: NextRequest): Promise<NextResponse | null> {
  const sessao = await lerSessao(req)
  if (!sessao) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  return null
}

/** Igual a `verificarSessao`, mas exige papel de administrador (403 caso contrário). */
export async function verificarSessaoAdmin(req: NextRequest): Promise<NextResponse | null> {
  const sessao = await lerSessao(req)
  if (!sessao) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  if (sessao.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso restrito a administradores.' }, { status: 403 })
  }
  return null
}

/** Igual a `verificarSessao`, mas exige a marcação de Business Partner (403 caso contrário). */
export async function verificarSessaoBP(req: NextRequest): Promise<NextResponse | null> {
  const sessao = await lerSessao(req)
  if (!sessao) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  if (!sessao.is_business_partner) {
    return NextResponse.json({ error: 'Acesso restrito a Business Partners.' }, { status: 403 })
  }
  return null
}
