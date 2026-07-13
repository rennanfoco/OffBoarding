import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { renderToBuffer } from '@react-pdf/renderer'
import { EntrevistaPDF, type EntrevistaData } from '@/components/EntrevistaPDF'
import { verificarSessao } from '@/lib/auth'
import React from 'react'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verificarSessao(req)
  if (auth) return auth

  const { id } = await params

  try {
    const [row] = await sql`
      SELECT * FROM entrevistas_desligamento WHERE id = ${id}
    `

    if (!row) {
      return NextResponse.json({ error: 'Entrevista não encontrada.' }, { status: 404 })
    }

    const element = React.createElement(EntrevistaPDF, { data: row as EntrevistaData })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(element as any)
    const bytes  = new Uint8Array(buffer)

    const nomeArquivo = `entrevista-${row.nome.replace(/\s+/g, '-').toLowerCase()}.pdf`

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
