import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { z } from 'zod'

const escala = z.enum(['otimo', 'bom', 'regular', 'ruim'])

const bodySchema = z.object({
  // Identificação
  cpf:             z.string().min(11, 'CPF inválido'),
  nome:            z.string().min(1),
  data_nascimento: z.string().optional(),
  cargo:           z.string().optional(),
  tempo_empresa:   z.string().optional(),
  loja_area:       z.string().optional(),
  gestor_imediato: z.string().optional(),

  // Passo 1
  bp_responsavel:       z.string().min(1, 'Selecione o BP responsável'),
  motivo_saida:         z.string().min(1, 'Selecione o motivo da saída'),
  entrevista_realizada: z.enum([
    'sim_realizada',
    'nao_recusou',
    'nao_decisao_empresa',
    'nao_nao_respondeu',
    'nao_sem_contato',
  ]),

  // Passo 2 — perguntas abertas Q1 e Q2
  real_motivo_desligamento: z.string().optional(),
  o_que_evitaria_saida:     z.string().optional(),

  // Passo 2 — escala + justificativa Q3–Q13
  avaliacao_lideranca:              escala.optional(),
  avaliacao_lideranca_just:         z.string().optional(),
  avaliacao_colegas:                escala.optional(),
  avaliacao_colegas_just:           z.string().optional(),
  recebia_feedbacks:                escala.optional(),
  recebia_feedbacks_just:           z.string().optional(),

  clareza_objetivos:                escala.optional(),
  clareza_objetivos_just:           z.string().optional(),
  atividades_alinhadas_cargo:       escala.optional(),
  atividades_alinhadas_cargo_just:  z.string().optional(),

  oportunidades_crescimento:        escala.optional(),
  oportunidades_crescimento_just:   z.string().optional(),
  oportunidades_treinamento:        escala.optional(),
  oportunidades_treinamento_just:   z.string().optional(),

  avaliacao_remuneracao:            escala.optional(),
  avaliacao_remuneracao_just:       z.string().optional(),

  avaliacao_ferramentas:            escala.optional(),
  avaliacao_ferramentas_just:       z.string().optional(),
  avaliacao_estrutura_fisica:       escala.optional(),
  avaliacao_estrutura_fisica_just:  z.string().optional(),

  ambiente_trabalho:                escala.optional(),
  ambiente_trabalho_just:           z.string().optional(),

  // Q14 — NPS
  nps:      z.coerce.number().int().min(0).max(10).optional(),
  nps_just: z.string().optional(),

  // Passo 3
  parecer_bp: z.string().optional(),
})

export async function POST(req: NextRequest) {
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

  try {
    await sql`INSERT INTO entrevistas_desligamento ${sql(parsed.data)}`
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro interno.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
