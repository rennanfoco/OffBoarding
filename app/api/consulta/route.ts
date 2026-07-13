import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verificarSessao } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = verificarSessao(req)
  if (auth) return auth

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  try {
    let rows

    if (q.length > 0) {
      const cpfLimpo = q.replace(/\D/g, '')
      if (cpfLimpo.length > 0 && /^\d+$/.test(cpfLimpo)) {
        rows = await sql`
          SELECT id, nome, cpf, cargo, loja_area, bp_responsavel, motivo_saida, entrevista_realizada, criado_em
          FROM entrevistas_desligamento
          WHERE cpf ILIKE ${'%' + cpfLimpo + '%'}
          ORDER BY criado_em DESC
        `
      } else {
        rows = await sql`
          SELECT id, nome, cpf, cargo, loja_area, bp_responsavel, motivo_saida, entrevista_realizada, criado_em
          FROM entrevistas_desligamento
          WHERE nome ILIKE ${'%' + q + '%'}
          ORDER BY criado_em DESC
        `
      }
    } else {
      rows = await sql`
        SELECT id, nome, cpf, cargo, loja_area, bp_responsavel, motivo_saida, entrevista_realizada, criado_em
        FROM entrevistas_desligamento
        ORDER BY criado_em DESC
      `
    }

    return NextResponse.json({ entrevistas: rows })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
