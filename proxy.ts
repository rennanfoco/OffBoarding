import { NextRequest, NextResponse } from 'next/server'
import { lerSessao } from '@/lib/auth'

export async function proxy(req: NextRequest) {
  const sessao = await lerSessao(req)

  // Sem sessão válida — redireciona para o login
  if (!sessao) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Logado, mas sem papel de administrador tentando acessar área restrita
  if (req.nextUrl.pathname.startsWith('/admin') && sessao.role !== 'admin') {
    return NextResponse.redirect(new URL('/consulta', req.url))
  }

  // Entrevista: BP entra pra preencher de verdade; admin sem a tag entra só
  // pra visualizar o formulário (o envio continua bloqueado no servidor, em
  // POST /api/entrevista, que exige a tag de BP independente disso).
  const podeAbrirEntrevista = sessao.is_business_partner || sessao.role === 'admin'
  if (req.nextUrl.pathname.startsWith('/entrevista') && !podeAbrirEntrevista) {
    return NextResponse.redirect(new URL('/consulta', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/consulta', '/admin/:path*', '/conta', '/entrevista'],
}
