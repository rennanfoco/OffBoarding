import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verificarSessaoAdmin } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarSessaoAdmin(req)
  if (auth) return auth

  const { id } = await params

  const [removida] = await sql`
    DELETE FROM entrevistas_desligamento WHERE id = ${id} RETURNING id
  `

  if (!removida) {
    return NextResponse.json({ error: 'Entrevista não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
