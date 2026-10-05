import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { lerSessao, verificarSessaoEditor } from '@/lib/auth'
import { bodySchema } from '@/app/api/entrevista/route'
import { mascararCpf } from '@/lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarSessaoEditor(req)
  if (auth) return auth

  const { id } = await params

  const [entrevista] = await sql`
    SELECT * FROM entrevistas_desligamento WHERE id = ${id}
  `

  if (!entrevista) {
    return NextResponse.json({ error: 'Entrevista não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ entrevista })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarSessaoEditor(req)
  if (auth) return auth

  const sessao = await lerSessao(req) // garantido não-nulo pelo guard acima
  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos.', details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  // bp_responsavel nunca é alterado por uma edição — continua sendo o
  // registro de quem realmente fez a entrevista.
  const dados = {
    ...parsed.data,
    editado_por: sessao!.nome,
    editado_em:  new Date(),
  }

  try {
    const [atualizada] = await sql`
      UPDATE entrevistas_desligamento
      SET ${sql(dados)}
      WHERE id = ${id}
      RETURNING id
    `

    if (!atualizada) {
      return NextResponse.json({ error: 'Entrevista não encontrada.' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Erro ao editar entrevista:', e)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verificarSessaoEditor(req)
  if (auth) return auth

  const sessao = await lerSessao(req) // garantido não-nulo pelo guard acima
  const { id } = await params

  // Exclusão e registro no log na mesma transação: ou acontecem as duas
  // coisas, ou nenhuma — nunca uma entrevista some sem deixar rastro.
  const removida = await sql.begin(async (tx) => {
    const [linha] = await tx`
      DELETE FROM entrevistas_desligamento WHERE id = ${id} RETURNING id, nome, cpf
    `
    if (!linha) return null

    await tx`
      INSERT INTO entrevistas_excluidas (entrevista_id, nome, cpf_mascarado, excluido_por)
      VALUES (${linha.id}, ${linha.nome}, ${mascararCpf(linha.cpf)}, ${sessao!.nome})
    `
    return linha
  })

  if (!removida) {
    return NextResponse.json({ error: 'Entrevista não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
