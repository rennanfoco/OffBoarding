'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FocoHeader } from '@/components/FocoHeader'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

// ─── Schema ──────────────────────────────────────────────────────────────────

const escala = z.enum(['otimo', 'bom', 'regular', 'ruim'])

const schema = z.object({
  cpf:             z.string().min(11, 'Informe o CPF completo'),
  nome:            z.string().min(1, 'CPF não encontrado ou não consultado'),
  data_nascimento: z.string().optional(),
  cargo:           z.string().optional(),
  tempo_empresa:   z.string().optional(),
  loja_area:       z.string().optional(),
  gestor_imediato: z.string().optional(),

  bp_responsavel:       z.string().min(1, 'Selecione o BP responsável'),
  motivo_saida:         z.string().min(1, 'Selecione o motivo da saída'),
  entrevista_realizada: z.enum([
    'sim_realizada',
    'nao_recusou',
    'nao_decisao_empresa',
    'nao_nao_respondeu',
    'nao_sem_contato',
  ], { error: 'Selecione uma opção' }),

  real_motivo_desligamento:        z.string().optional(),
  o_que_evitaria_saida:            z.string().optional(),

  avaliacao_lideranca:             escala.optional(),
  avaliacao_lideranca_just:        z.string().optional(),
  avaliacao_colegas:               escala.optional(),
  avaliacao_colegas_just:          z.string().optional(),
  recebia_feedbacks:               escala.optional(),
  recebia_feedbacks_just:          z.string().optional(),

  clareza_objetivos:               escala.optional(),
  clareza_objetivos_just:          z.string().optional(),
  atividades_alinhadas_cargo:      escala.optional(),
  atividades_alinhadas_cargo_just: z.string().optional(),

  oportunidades_crescimento:       escala.optional(),
  oportunidades_crescimento_just:  z.string().optional(),
  oportunidades_treinamento:       escala.optional(),
  oportunidades_treinamento_just:  z.string().optional(),

  avaliacao_remuneracao:           escala.optional(),
  avaliacao_remuneracao_just:      z.string().optional(),

  avaliacao_ferramentas:           escala.optional(),
  avaliacao_ferramentas_just:      z.string().optional(),
  avaliacao_estrutura_fisica:      escala.optional(),
  avaliacao_estrutura_fisica_just: z.string().optional(),

  ambiente_trabalho:               escala.optional(),
  ambiente_trabalho_just:          z.string().optional(),

  nps:      z.coerce.number().int().min(0).max(10).optional(),
  nps_just: z.string().optional(),

  parecer_bp: z.string().optional(),
})

type FormValues = z.input<typeof schema>
type FormOutput = z.output<typeof schema>
type BuscaStatus = 'idle' | 'loading' | 'found' | 'not_found' | 'error'

// ─── Constantes ──────────────────────────────────────────────────────────────

const ESCALA = [
  { value: 'otimo',   label: 'Ótimo'   },
  { value: 'bom',     label: 'Bom'     },
  { value: 'regular', label: 'Regular' },
  { value: 'ruim',    label: 'Ruim'    },
]

const MOTIVOS_SAIDA = [
  'Pedido de demissão',
  'Dispensa sem justa causa',
  'Dispensa por justa causa',
  'Término de contrato',
  'Acordo mútuo (§ 484-A CLT)',
  'Aposentadoria',
  'Falecimento',
  'Abandono de emprego',
  'Outros',
]

const LISTA_BPS = ['Geovany Araujo', 'Henmilly Vitória', 'Rafaela Alessandra']

const STATUS_ENTREVISTA = [
  { value: 'sim_realizada',         label: 'Sim, realizada com o ex-colaborador' },
  { value: 'nao_recusou',           label: 'Não realizada – ex-colaborador recusou participar' },
  { value: 'nao_decisao_empresa',   label: 'Não realizada – decisão da empresa' },
  { value: 'nao_nao_respondeu',     label: 'Não realizada – ex-colaborador não respondeu' },
  { value: 'nao_sem_contato',       label: 'Não realizada – não foi realizado contato com o ex-colaborador' },
]

// ─── Componentes internos ────────────────────────────────────────────────────

function PerguntaEscala({
  id,
  justId,
  texto,
  register,
  errorEscala,
}: {
  id: keyof FormValues
  justId: keyof FormValues
  texto: string
  register: ReturnType<typeof useForm<FormValues>>['register']
  errorEscala?: string
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium leading-snug">{texto}</p>
      <div className="flex flex-wrap gap-4">
        {ESCALA.map((o) => (
          <label key={o.value} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input type="radio" value={o.value} {...register(id)} className="accent-primary" />
            {o.label}
          </label>
        ))}
      </div>
      {errorEscala && <p className="text-xs text-destructive">{errorEscala}</p>}
      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs font-normal">Justificativa (opcional)</Label>
        <Textarea
          placeholder="Comentário sobre esta avaliação..."
          rows={2}
          {...register(justId)}
        />
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function EntrevistaPage() {
  const [buscaStatus,        setBuscaStatus]        = useState<BuscaStatus>('idle')
  const [enviado,            setEnviado]            = useState(false)
  const [enviando,           setEnviando]           = useState(false)
  const [erroEnvio,          setErroEnvio]          = useState('')
  const [mostrarPerguntas,   setMostrarPerguntas]   = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schema) })

  async function buscarCpf(cpf: string) {
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length < 11) {
      setBuscaStatus('idle')
      setValue('nome', '')
      setValue('data_nascimento', '')
      setValue('cargo', '')
      setValue('tempo_empresa', '')
      setValue('loja_area', '')
      return
    }
    setBuscaStatus('loading')
    try {
      const res = await fetch(`/api/funcionario/${encodeURIComponent(cpfLimpo)}`)
      if (res.status === 404) { setBuscaStatus('not_found'); return }
      if (!res.ok)            { setBuscaStatus('error');     return }
      const data = await res.json()
      setValue('nome',            data.nome            ?? '')
      const nascimento = new Date(data.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
      setValue('data_nascimento', nascimento)
      setValue('cargo',           data.cargo           ?? '')
      const rawTempo = data.tempo_empresa ?? ''
      const matchAnos  = rawTempo.match(/(\d+)\s*ano/)
      const matchMeses = rawTempo.match(/(\d+)\s*m[eê]s/)
      const anos  = matchAnos  ? parseInt(matchAnos[1])  : 0
      const meses = matchMeses ? parseInt(matchMeses[1]) : 0
      const tempoFormatado = (matchAnos || matchMeses)
        ? (anos + meses / 12).toFixed(1)
        : rawTempo
      setValue('tempo_empresa', tempoFormatado)
      setValue('loja_area',       data.loja_area       ?? '')
      setBuscaStatus('found')
    } catch {
      setBuscaStatus('error')
    }
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 11)
    const formatted = raw
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    e.target.value = formatted
    setValue('cpf', raw)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarCpf(raw), 600)
  }

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  function formatarDataParaBanco(dataBr?: string) {
    if (!dataBr) return dataBr
    const [dia, mes, ano] = dataBr.split('/')
    if (!dia || !mes || !ano) return dataBr
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`
  }

  async function onSubmit(data: FormOutput) {
    setEnviando(true)
    setErroEnvio('')
    const payload = {
      ...data,
      data_nascimento: formatarDataParaBanco(data.data_nascimento),
    }
    try {
      const res = await fetch('/api/entrevista', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        const json = await res.json()
        setErroEnvio(json.error ?? 'Erro ao enviar. Tente novamente.')
        return
      }
      setEnviado(true)
    } finally {
      setEnviando(false)
    }
  }

  function onInvalid() {
    setErroEnvio('Existem campos obrigatórios não preenchidos ou o CPF não foi encontrado. Verifique os campos destacados no topo do formulário.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Tela de sucesso ────────────────────────────────────────────────────────
  if (enviado) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
        <Card className="max-w-md w-full text-center shadow-lg">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold">Entrevista registrada!</h2>
            <p className="text-muted-foreground text-sm">
              A entrevista de desligamento foi salva com sucesso.
            </p>
            <Button className="w-full" render={<Link href="/" />}>
              Voltar ao menu
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  // ── Formulário ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <FocoHeader />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-2xl mx-auto space-y-6">

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">Entrevista de Desligamento</h1>
            <p className="text-muted-foreground text-sm">
              Preencha os campos abaixo com as informações e respostas da entrevista.
            </p>
          </div>

          {erroEnvio && (
            <p className="text-sm text-destructive text-center bg-destructive/10 rounded-md py-2 px-3">
              {erroEnvio}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6">

            {/* ── Passo 1: Identificação ──────────────────────────────────── */}
            <Card>
              <CardHeader className="card-section">
                <CardTitle className="text-base">1º Passo — Identificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* CPF */}
                <div className="space-y-1">
                  <Label htmlFor="cpf">CPF do ex-colaborador</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      className="max-w-[180px] tracking-wider"
                      inputMode="numeric"
                      onChange={handleCpfChange}
                    />
                    {buscaStatus === 'loading'   && <span className="text-sm text-muted-foreground">Buscando...</span>}
                    {buscaStatus === 'found'     && <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Encontrado ✓</Badge>}
                    {buscaStatus === 'not_found' && <Badge variant="destructive">Não encontrado</Badge>}
                    {buscaStatus === 'error'     && <Badge variant="destructive">Erro ao consultar RM</Badge>}
                  </div>
                  {errors.cpf  && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
                  {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
                </div>

                {/* Dados auto-preenchidos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Nome completo</Label>
                    <Input readOnly {...register('nome')} className="bg-muted cursor-default" />
                  </div>
                  <div className="space-y-1">
                    <Label>Data de nascimento</Label>
                    <Input readOnly {...register('data_nascimento')} className="bg-muted cursor-default" />
                  </div>
                  <div className="space-y-1">
                    <Label>Cargo</Label>
                    <Input readOnly {...register('cargo')} className="bg-muted cursor-default" />
                  </div>
                  <div className="space-y-1">
                    <Label>Tempo de empresa</Label>
                    <Input readOnly {...register('tempo_empresa')} className="bg-muted cursor-default" />
                  </div>
                  <div className="space-y-1">
                    <Label>Loja / Área</Label>
                    <Input readOnly {...register('loja_area')} className="bg-muted cursor-default" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="gestor_imediato">Gestor imediato</Label>
                    <Input
                      id="gestor_imediato"
                      placeholder="Nome do gestor direto do colaborador"
                      {...register('gestor_imediato')}
                    />
                  </div>
                </div>

                <Separator />

                {/* BP responsável */}
                <div className="space-y-1">
                  <Label>BP responsável pela entrevista</Label>
                  <Controller
                    name="bp_responsavel"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o BP..." />
                        </SelectTrigger>
                        <SelectContent>
                          {LISTA_BPS.map((bp) => (
                            <SelectItem key={bp} value={bp}>{bp}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.bp_responsavel && <p className="text-xs text-destructive">{errors.bp_responsavel.message}</p>}
                </div>

                {/* Motivo da saída */}
                <div className="space-y-1">
                  <Label>Motivo da saída</Label>
                  <Controller
                    name="motivo_saida"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o motivo..." />
                        </SelectTrigger>
                        <SelectContent>
                          {MOTIVOS_SAIDA.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.motivo_saida && <p className="text-xs text-destructive">{errors.motivo_saida.message}</p>}
                </div>

                {/* Status da entrevista */}
                <div className="space-y-1">
                  <Label>A entrevista de desligamento foi realizada?</Label>
                  <Controller
                    name="entrevista_realizada"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(val) => {
                          field.onChange(val)
                          setMostrarPerguntas(val === 'sim_realizada')
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma opção..." />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_ENTREVISTA.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.entrevista_realizada && <p className="text-xs text-destructive">{errors.entrevista_realizada.message}</p>}
                </div>

              </CardContent>
            </Card>

            {/* ── Passo 2: Perguntas (só se entrevista realizada) ─────────── */}
            {mostrarPerguntas && (
              <>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground font-medium">2º Passo — Perguntas da Entrevista</p>
                </div>

                {/* Motivo do desligamento */}
                <Card>
                  <CardHeader className="card-section">
                    <CardTitle className="text-base">Motivo do desligamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium">1. Na sua opinião, qual é o real motivo do seu desligamento?</p>
                    <Textarea
                      placeholder="Descreva o motivo..."
                      rows={3}
                      {...register('real_motivo_desligamento')}
                    />
                  </CardContent>
                </Card>

                {/* Retenção */}
                <Card>
                  <CardHeader className="card-section">
                    <CardTitle className="text-base">Retenção</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-medium">2. O que poderia ter sido feito para evitar o seu desligamento?</p>
                    <Textarea
                      placeholder="Descreva o que poderia ter sido feito..."
                      rows={3}
                      {...register('o_que_evitaria_saida')}
                    />
                  </CardContent>
                </Card>

                {/* Liderança e relações */}
                <Card>
                  <CardHeader className="card-section">
                    <CardTitle className="text-base">Liderança e relações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <PerguntaEscala
                      id="avaliacao_lideranca"
                      justId="avaliacao_lideranca_just"
                      texto="3. Como você avalia sua relação com sua liderança direta?"
                      register={register}
                    />
                    <Separator />
                    <PerguntaEscala
                      id="avaliacao_colegas"
                      justId="avaliacao_colegas_just"
                      texto="4. Como você avalia sua relação com seus colegas de trabalho?"
                      register={register}
                    />
                    <Separator />
                    <PerguntaEscala
                      id="recebia_feedbacks"
                      justId="recebia_feedbacks_just"
                      texto="5. Você recebia feedbacks com frequência?"
                      register={register}
                    />
                  </CardContent>
                </Card>

                {/* Clareza e direcionamento */}
                <Card>
                  <CardHeader className="card-section">
                    <CardTitle className="text-base">Clareza e direcionamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <PerguntaEscala
                      id="clareza_objetivos"
                      justId="clareza_objetivos_just"
                      texto="6. Os objetivos e metas do seu trabalho eram claros para você?"
                      register={register}
                    />
                    <Separator />
                    <PerguntaEscala
                      id="atividades_alinhadas_cargo"
                      justId="atividades_alinhadas_cargo_just"
                      texto="7. Suas atividades estavam alinhadas com o seu cargo?"
                      register={register}
                    />
                  </CardContent>
                </Card>

                {/* Desenvolvimento e carreira */}
                <Card>
                  <CardHeader className="card-section">
                    <CardTitle className="text-base">Desenvolvimento e carreira</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <PerguntaEscala
                      id="oportunidades_crescimento"
                      justId="oportunidades_crescimento_just"
                      texto="8. Como você avalia as oportunidades de crescimento e plano de carreira que a empresa oferece?"
                      register={register}
                    />
                    <Separator />
                    <PerguntaEscala
                      id="oportunidades_treinamento"
                      justId="oportunidades_treinamento_just"
                      texto="9. Como você avalia as oportunidades de treinamento e desenvolvimento que a empresa oferece?"
                      register={register}
                    />
                  </CardContent>
                </Card>

                {/* Remuneração e benefícios */}
                <Card>
                  <CardHeader className="card-section">
                    <CardTitle className="text-base">Remuneração e benefícios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PerguntaEscala
                      id="avaliacao_remuneracao"
                      justId="avaliacao_remuneracao_just"
                      texto="10. Como você avalia sua remuneração (salário + benefícios)?"
                      register={register}
                    />
                  </CardContent>
                </Card>

                {/* Estrutura e ferramentas */}
                <Card>
                  <CardHeader className="card-section">
                    <CardTitle className="text-base">Estrutura e ferramentas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <PerguntaEscala
                      id="avaliacao_ferramentas"
                      justId="avaliacao_ferramentas_just"
                      texto="11. Como você avalia as ferramentas e recursos disponibilizados para o seu trabalho?"
                      register={register}
                    />
                    <Separator />
                    <PerguntaEscala
                      id="avaliacao_estrutura_fisica"
                      justId="avaliacao_estrutura_fisica_just"
                      texto="12. Como você avalia a estrutura física da empresa?"
                      register={register}
                    />
                  </CardContent>
                </Card>

                {/* Ambiente e cultura */}
                <Card>
                  <CardHeader className="card-section">
                    <CardTitle className="text-base">Ambiente e cultura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PerguntaEscala
                      id="ambiente_trabalho"
                      justId="ambiente_trabalho_just"
                      texto="13. Como você se sentia no ambiente de trabalho?"
                      register={register}
                    />
                  </CardContent>
                </Card>

                {/* Experiência geral — NPS */}
                <Card>
                  <CardHeader className="card-section">
                    <CardTitle className="text-base">Experiência geral</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        14. Em uma escala de 0 a 10, o quanto você recomendaria a Foco como uma boa empresa para se trabalhar?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 11 }, (_, i) => 10 - i).map((i) => (
                          <label key={i} className="flex flex-col items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              value={i}
                              {...register('nps')}
                              className="accent-primary"
                            />
                            <span className="text-sm font-medium">{i}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs font-normal">Justificativa (opcional)</Label>
                      <Textarea
                        placeholder="Comentário sobre a nota..."
                        rows={2}
                        {...register('nps_just')}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* ── Passo 3: Parecer do BP ──────────────────────────────────── */}
            <Card>
              <CardHeader className="card-section">
                <CardTitle className="text-base">3º Passo — Parecer do BP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <Label htmlFor="parecer_bp">
                    Observações e parecer do Business Partner
                  </Label>
                  <Textarea
                    id="parecer_bp"
                    placeholder="Registre aqui suas observações, análises e recomendações sobre este desligamento..."
                    rows={5}
                    {...register('parecer_bp')}
                  />
                </div>
              </CardContent>
            </Card>

            {erroEnvio && <p className="text-sm text-destructive text-center">{erroEnvio}</p>}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={enviando || buscaStatus === 'loading'}
            >
              {enviando ? 'Salvando...' : 'Salvar entrevista'}
            </Button>

          </form>
        </div>
      </main>
    </div>
  )
}
