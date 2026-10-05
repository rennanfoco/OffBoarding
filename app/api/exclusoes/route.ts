import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { verificarSessaoAdmin } from '@/lib/auth'

// Log de entrevistas excluídas (quem, quando, o quê). Só admin enxerga — é a
// trilha de auditoria de quem tem poder de excluir (admin e editor).
export async function GET(req: NextRequest) {
  const auth = await verificarSessaoAdmin(req)
  if (auth) return auth

  const exclusoes = await sql`
    SELECT id, nome, cpf_mascarado, excluido_por, excluido_em
    FROM entrevistas_excluidas
    ORDER BY excluido_em DESC
    LIMIT 500
  `

  return NextResponse.json({ exclusoes })
}
