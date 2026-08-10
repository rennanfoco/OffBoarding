import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import sql from '@/lib/db'
import { lerSessao } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const sessao = await lerSessao(req)
  if (!sessao) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  return NextResponse.json({
    usuario:             sessao.usuario,
    nome:                sessao.nome,
    role:                sessao.role,
    is_business_partner: sessao.is_business_partner,
  })
}

const bodySchema = z.object({
  senhaAtual: z.string().min(1, 'Informe a senha atual'),
  senhaNova:  z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres'),
})

// Troca da própria senha (qualquer usuário logado, admin ou comum).
export async function PUT(req: NextRequest) {
  const sessao = await lerSessao(req)
  if (!sessao) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 422 }
    )
  }

  const { senhaAtual, senhaNova } = parsed.data

  const [user] = await sql`SELECT senha_hash FROM usuarios WHERE id = ${sessao.uid}`
  if (!user || !(await bcrypt.compare(senhaAtual, user.senha_hash))) {
    return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 })
  }

  const novoHash = await bcrypt.hash(senhaNova, 10)
  await sql`UPDATE usuarios SET senha_hash = ${novoHash} WHERE id = ${sessao.uid}`

  return NextResponse.json({ ok: true })
}
