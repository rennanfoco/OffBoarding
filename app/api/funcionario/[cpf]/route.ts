import { NextRequest, NextResponse } from 'next/server'
import { verificarSessaoBP } from '@/lib/auth'

const TIMEOUT_MS   = 8000
const MAX_TENTATIVAS = 3 // 1 tentativa original + 2 retentativas

/**
 * fetch com timeout e retentativa automática — só reenvia em falhas
 * transitórias (erro de rede/timeout ou 5xx do TOTVS). 404/401/403 são
 * respostas determinísticas do TOTVS e não adianta tentar de novo.
 */
async function fetchComRetry(url: string, options: RequestInit) {
  let ultimoErro: unknown

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    const controller = new AbortController()
    const timeoutId   = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeoutId)

      if (response.status < 500) return response // sucesso ou erro do cliente — não repete

      ultimoErro = new Error(`TOTVS respondeu ${response.status}`)
    } catch (e) {
      clearTimeout(timeoutId)
      ultimoErro = e
    }

    if (tentativa < MAX_TENTATIVAS) {
      await new Promise((r) => setTimeout(r, 500 * tentativa)) // backoff: 500ms, 1000ms
    }
  }

  throw ultimoErro
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cpf: string }> }
) {
  const auth = await verificarSessaoBP(req)
  if (auth) return auth

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
    const response = await fetchComRetry(url, {
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

    // TOTVS devolve o tempo de empresa em dias corridos — convertemos direto
    // pra meses aproximados (arredondado), sem passar por "X anos e Y meses".
    const tempoRaw = row.TEMPO_EMPRESA ?? row.tempo_empresa ?? ''
    const tempoEmMeses = (() => {
      const dias = Number(tempoRaw)
      if (!tempoRaw || isNaN(dias)) return String(tempoRaw)
      const meses = Math.round(dias / 30)
      return meses === 1 ? '1 mês' : `${meses} meses`
    })()

    return NextResponse.json({
      nome:            row.NOME            ?? row.nome            ?? '',
      data_nascimento: row.DTNASCIMENTO    ?? row.dataNascimento  ?? '',
      cargo:           row.CARGO           ?? row.cargo           ?? '',
      tempo_empresa:   tempoEmMeses,
      loja_area:       row.CODIGO_CC       ?? row.codigo_cc       ?? ''
    })
  } catch (e) {
    const timeout = e instanceof Error && e.name === 'AbortError'
    return NextResponse.json(
      { error: timeout ? 'O TOTVS RM demorou demais para responder.' : 'Falha de conexão com o TOTVS RM.' },
      { status: 503 }
    )
  }
}
