import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import sql from '@/lib/db'
import { lerSessao, verificarSessaoAdmin } from '@/lib/auth'

const bodySchema = z.object({
  nome:                z.string().min(1).optional(),
  role:                z.enum(['admin', 'comum']).optional(),
  senha:               z.string().min(6, 'A senha deve ter pelo menos 6 caracteres').optional(),
  is_business_partner: z.boolean().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarSessaoAdmin(req)
  if (auth) return auth

  const { id } = await params
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 422 }
    )
  }

  const { nome, role, senha, is_business_partner } = parsed.data
  const senhaHash = senha ? await bcrypt.hash(senha, 10) : null

  const [atualizado] = await sql`
    UPDATE usuarios SET
      nome                 = COALESCE(${nome ?? null}, nome),
      role                 = COALESCE(${role ?? null}, role),
      senha_hash           = COALESCE(${senhaHash}, senha_hash),
      is_business_partner  = COALESCE(${is_business_partner ?? null}, is_business_partner)
    WHERE id = ${id}
    RETURNING id, usuario, nome, role, is_business_partner, criado_em
  `

  if (!atualizado) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ usuario: atualizado })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarSessaoAdmin(req)
  if (auth) return auth

  const { id } = await params
  const sessao = await lerSessao(req)

  if (sessao?.uid === id) {
    return NextResponse.json({ error: 'Você não pode excluir seu próprio usuário.' }, { status: 400 })
  }

  const [alvo] = await sql`SELECT role FROM usuarios WHERE id = ${id}`
  if (!alvo) {
    return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })
  }

  if (alvo.role === 'admin') {
    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM usuarios WHERE role = 'admin'`
    if (count <= 1) {
      return NextResponse.json(
        { error: 'Não é possível excluir o único administrador restante.' },
        { status: 400 }
      )
    }
  }

  await sql`DELETE FROM usuarios WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
