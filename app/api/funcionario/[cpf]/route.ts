import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cpf: string }> }
) {
  const { cpf } = await params
  const cpfLimpo = cpf.replace(/\D/g, '')

  const baseUrl  = process.env.TOTVS_RM_CPF_URL
  const username = process.env.TOTVS_RM_USERNAME
  const password = process.env.TOTVS_RM_PASSWORD

  if (!baseUrl || !username || !password) {
    return NextResponse.json(
      { error: 'Configuração do TOTVS RM ausente no servidor.' },
      { status: 500 }
    )
  }

  const credentials = Buffer.from(`${username}:${password}`).toString('base64')
  const url = `${baseUrl}/?parameters=CPF=${cpfLimpo}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'CPF não encontrado.' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Erro ao consultar o TOTVS RM.' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // consultaSQLServer retorna um array — pega o ultimo registro
    const row = Array.isArray(data) ? data[data.length -1] : data

    if (!row) {
      return NextResponse.json({ error: 'CPF não encontrado.' }, { status: 404 })
    }
    
    const tempoRaw = row.TEMPO_EMPRESA ?? row.tempo_empresa ?? ''
    const tempoEmAnos = (() => {
      const n = Number(tempoRaw)
      if (!tempoRaw || isNaN(n)) return String(tempoRaw)
      const anos = Math.floor(n / 365)
      const meses = Math.floor((n % 365) / 30)
      if (anos === 0) return meses <= 1 ? '1 mês' : `${meses} meses`
      if (meses === 0) return anos === 1 ? '1 ano' : `${anos} anos`
      return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${meses} ${meses === 1 ? 'mês' : 'meses'}`
    })()

    return NextResponse.json({
      nome:            row.NOME            ?? row.nome            ?? '',
      data_nascimento: row.DTNASCIMENTO    ?? row.dataNascimento  ?? '',
      cargo:           row.CARGO           ?? row.cargo           ?? '',
      tempo_empresa:   tempoEmAnos,
      loja_area:       row.CODIGO_CC       ?? row.codigo_cc       ?? ''
    })
  } catch {
    return NextResponse.json(
      { error: 'Falha de conexão com o TOTVS RM.' },
      { status: 503 }
    )
  }
}
