import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import sql from '@/lib/db'
import { verificarSessaoAdmin } from '@/lib/auth'

const bodySchema = z.object({
  usuario:             z.string().min(1, 'Informe o usuário'),
  nome:                z.string().min(1, 'Informe o nome'),
  senha:               z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  role:                z.enum(['admin', 'comum']),
  is_business_partner: z.boolean().optional().default(false),
})

export async function GET(req: NextRequest) {
  const auth = await verificarSessaoAdmin(req)
  if (auth) return auth

  const usuarios = await sql`
    SELECT id, usuario, nome, role, is_business_partner, criado_em FROM usuarios ORDER BY criado_em
  `
  return NextResponse.json({ usuarios })
}

export async function POST(req: NextRequest) {
  const auth = await verificarSessaoAdmin(req)
  if (auth) return auth

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' },
      { status: 422 }
    )
  }

  const { usuario, nome, senha, role, is_business_partner } = parsed.data
  const senhaHash = await bcrypt.hash(senha, 10)

  try {
    const [novo] = await sql`
      INSERT INTO usuarios (usuario, nome, senha_hash, role, is_business_partner)
      VALUES (${usuario}, ${nome}, ${senhaHash}, ${role}, ${is_business_partner})
      RETURNING id, usuario, nome, role, is_business_partner, criado_em
    `
    return NextResponse.json({ usuario: novo }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.message.includes('usuarios_usuario_key')) {
      return NextResponse.json({ error: 'Esse nome de usuário já existe.' }, { status: 409 })
    }
    const msg = e instanceof Error ? e.message : 'Erro interno.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
