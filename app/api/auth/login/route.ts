import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import sql from '@/lib/db'
import { criarSessao } from '@/lib/auth'
import { estaBloqueado, registrarFalha, limparTentativas, obterIp } from '@/lib/rate-limit'

const bodySchema = z.object({
  usuario: z.string().min(1, 'Informe o usuário'),
  senha:   z.string().min(1, 'Informe a senha'),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Informe usuário e senha.' },
      { status: 400 }
    )
  }

  const { usuario, senha } = parsed.data

  // Chave combina IP + usuário: trava tentativas repetidas contra uma mesma
  // conta vindas do mesmo IP, sem derrubar todo mundo que compartilha o IP
  // (ex.: rede da empresa) por causa de um único usuário travado.
  const chave = `${obterIp(req)}:${usuario}`

  const bloqueio = estaBloqueado(chave)
  if (bloqueio.bloqueado) {
    return NextResponse.json(
      { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
      { status: 429, headers: { 'Retry-After': String(bloqueio.retryAfterSegundos) } }
    )
  }

  const [user] = await sql`
    SELECT id, usuario, nome, senha_hash, role, is_business_partner FROM usuarios WHERE usuario = ${usuario}
  `

  if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
    registrarFalha(chave)
    return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 })
  }

  limparTentativas(chave)

  const cookie = await criarSessao({
    uid:                 user.id,
    usuario:             user.usuario,
    nome:                user.nome,
    role:                user.role,
    is_business_partner: user.is_business_partner,
  })

  if (!cookie) {
    return NextResponse.json({ error: 'Configuração de autenticação ausente.' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })

  res.cookies.set('session', cookie, {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    secure:   process.env.NODE_ENV === 'production', // exige HTTPS em produção
    maxAge:   60 * 60 * 8, // 8 horas
  })

  return res
}
