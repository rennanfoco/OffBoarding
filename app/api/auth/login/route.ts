import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { usuario, senha } = await req.json()

  const usuarioCorreto = process.env.AUTH_USERNAME
  const senhaCorreta   = process.env.AUTH_PASSWORD
  const secret         = process.env.AUTH_SECRET

  if (!usuarioCorreto || !senhaCorreta || !secret) {
    return NextResponse.json({ error: 'Configuração de autenticação ausente.' }, { status: 500 })
  }

  if (usuario !== usuarioCorreto || senha !== senhaCorreta) {
    return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })

  res.cookies.set('session', secret, {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    // Em produção com HTTPS, adicione: secure: true
    maxAge:   60 * 60 * 8, // 8 horas
  })

  return res
}
