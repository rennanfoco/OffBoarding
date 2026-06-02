import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verificarSessao } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = verificarSessao(req)
  if (auth) return auth

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  let query = supabase
    .from('entrevistas_desligamento')
    .select('id, nome, cpf, cargo, loja_area, bp_responsavel, motivo_saida, entrevista_realizada, criado_em')
    .order('criado_em', { ascending: false })

  if (q.length > 0) {
    const cpfLimpo = q.replace(/\D/g, '')
    if (cpfLimpo.length > 0 && /^\d+$/.test(cpfLimpo)) {
      // Busca por CPF (parcial)
      query = query.ilike('cpf', `%${cpfLimpo}%`)
    } else {
      // Busca por nome
      query = query.ilike('nome', `%${q}%`)
    }
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ entrevistas: data ?? [] })
}
