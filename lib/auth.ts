import { NextRequest, NextResponse } from 'next/server'

/**
 * Verifica se a requisição possui um cookie de sessão válido.
 *
 * Retorna `null` se a sessão for válida (pode continuar).
 * Retorna um `NextResponse` com status 401 se não for — basta retornar
 * esse valor direto da rota.
 *
 * Uso em qualquer rota de API:
 *   const auth = verificarSessao(req)
 *   if (auth) return auth
 */
export function verificarSessao(req: NextRequest): NextResponse | null {
  const session = req.cookies.get('session')?.value
  const secret  = process.env.AUTH_SECRET

  if (!secret) {
    // Configuração ausente no servidor — falha segura
    return NextResponse.json(
      { error: 'Configuração de autenticação ausente.' },
      { status: 500 }
    )
  }

  if (!session || session !== secret) {
    return NextResponse.json(
      { error: 'Não autorizado.' },
      { status: 401 }
    )
  }

  return null // sessão válida
}
