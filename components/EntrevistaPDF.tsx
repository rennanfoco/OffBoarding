import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type EntrevistaData = {
  id:                string
  cpf:               string
  nome:              string
  data_nascimento?:  string
  cargo?:            string
  tempo_empresa?:    string
  loja_area?:        string
  gestor_imediato?:  string
  bp_responsavel:    string
  motivo_saida:      string
  entrevista_realizada: string
  criado_em:         string

  real_motivo_escala?:              string
  real_motivo_desligamento?:        string
  evitaria_saida_escala?:           string
  o_que_evitaria_saida?:            string

  avaliacao_lideranca?:             string
  avaliacao_lideranca_just?:        string
  avaliacao_colegas?:               string
  avaliacao_colegas_just?:          string
  recebia_feedbacks?:               string
  recebia_feedbacks_just?:          string

  clareza_objetivos?:               string
  clareza_objetivos_just?:          string
  atividades_alinhadas_cargo?:      string
  atividades_alinhadas_cargo_just?: string

  oportunidades_crescimento?:       string
  oportunidades_crescimento_just?:  string
  oportunidades_treinamento?:       string
  oportunidades_treinamento_just?:  string

  avaliacao_remuneracao?:           string
  avaliacao_remuneracao_just?:      string

  avaliacao_ferramentas?:           string
  avaliacao_ferramentas_just?:      string
  avaliacao_estrutura_fisica?:      string
  avaliacao_estrutura_fisica_just?: string

  ambiente_trabalho?:               string
  ambiente_trabalho_just?:          string

  nps?:      number
  nps_just?: string

  parecer_bp?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ESCALA_LABEL: Record<string, string> = {
  otimo:   'Ótimo',
  bom:     'Bom',
  regular: 'Regular',
  ruim:    'Ruim',
}

const STATUS_LABEL: Record<string, string> = {
  sim_realizada:        'Sim, realizada com o ex-colaborador',
  nao_recusou:          'Não realizada – ex-colaborador recusou participar',
  nao_decisao_empresa:  'Não realizada – decisão da empresa',
  nao_nao_respondeu:    'Não realizada – ex-colaborador não respondeu',
  nao_sem_contato:      'Não realizada – não foi realizado contato com o ex-colaborador',
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

function escala(val?: string) {
  return val ? ESCALA_LABEL[val] ?? val : '—'
}

function texto(val?: string) {
  return val?.trim() || '—'
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const RED   = '#D32F2F'
const GRAY  = '#757575'
const LIGHT = '#F5F5F5'
const BORDER = '#E0E0E0'

const s = StyleSheet.create({
  page: {
    fontFamily:  'Helvetica',
    fontSize:    9,
    color:       '#212121',
    paddingTop:  40,
    paddingBottom: 50,
    paddingHorizontal: 40,
  },
  // Header
  header: {
    borderBottomWidth: 2,
    borderBottomColor: RED,
    paddingBottom: 10,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: RED,
  },
  headerSub: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },
  // Seção
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: RED,
    backgroundColor: LIGHT,
    padding: '4 8',
    borderLeftWidth: 3,
    borderLeftColor: RED,
    marginBottom: 6,
  },
  // Grid de campos
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  field: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 4,
  },
  fieldFull: {
    width: '100%',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 7,
    color: GRAY,
    marginBottom: 1,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 2,
  },
  // Pergunta
  question: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  questionText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT,
    borderRadius: 3,
    padding: '2 6',
    fontSize: 8,
    color: RED,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    borderWidth: 1,
    borderColor: RED,
  },
  justLabel: {
    fontSize: 7,
    color: GRAY,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
    marginBottom: 1,
  },
  justValue: {
    fontSize: 8,
    color: '#424242',
    fontStyle: 'italic',
  },
  // NPS
  npsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  npsNumber: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: RED,
  },
  npsLabel: {
    fontSize: 8,
    color: GRAY,
  },
  // Parecer
  parecerBox: {
    backgroundColor: LIGHT,
    borderRadius: 4,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: RED,
  },
  parecerText: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 4,
  },
  footerText: {
    fontSize: 7,
    color: GRAY,
  },
})

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Campo({ label, value, full }: { label: string; value?: string; full?: boolean }) {
  return (
    <View style={full ? s.fieldFull : s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value || '—'}</Text>
    </View>
  )
}

function Pergunta({
  numero,
  texto: pergunta,
  escalaVal,
  justificativa,
}: {
  numero: number
  texto: string
  escalaVal?: string
  justificativa?: string
}) {
  return (
    <View style={s.question}>
      <Text style={s.questionText}>{numero}. {pergunta}</Text>
      <Text style={s.badge}>{escala(escalaVal)}</Text>
      {justificativa && justificativa.trim() && (
        <>
          <Text style={s.justLabel}>Justificativa</Text>
          <Text style={s.justValue}>{justificativa}</Text>
        </>
      )}
    </View>
  )
}

// ─── Documento PDF ────────────────────────────────────────────────────────────

export function EntrevistaPDF({ data }: { data: EntrevistaData }) {
  const realizada = data.entrevista_realizada === 'sim_realizada'

  return (
    <Document title={`Entrevista de Desligamento — ${data.nome}`}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Entrevista de Desligamento</Text>
          <Text style={s.headerSub}>
            Registrado em {formatDate(data.criado_em)} · Foco Aluguel de Carros
          </Text>
        </View>

        {/* Identificação */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Identificação</Text>
          <View style={s.grid}>
            <Campo label="Nome completo"    value={data.nome}             full />
            <Campo label="CPF"              value={data.cpf} />
            <Campo label="Data de nasc."    value={formatDate(data.data_nascimento)} />
            <Campo label="Cargo"            value={data.cargo} />
            <Campo label="Tempo de empresa" value={data.tempo_empresa} />
            <Campo label="Loja / Área"      value={data.loja_area} />
            <Campo label="Gestor imediato"  value={data.gestor_imediato} full />
            <Campo label="BP responsável"   value={data.bp_responsavel}  full />
          </View>
        </View>

        {/* Motivo e status */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Desligamento</Text>
          <View style={s.grid}>
            <Campo label="Motivo da saída"          value={data.motivo_saida} full />
            <Campo label="Status da entrevista"     value={STATUS_LABEL[data.entrevista_realizada] ?? data.entrevista_realizada} full />
          </View>
        </View>

        {/* Perguntas — só se realizada */}
        {realizada && (
          <>
            <View style={s.section}>
              <Text style={s.sectionTitle}>Motivo do desligamento</Text>
              <Pergunta numero={1} texto="Na sua opinião, qual é o real motivo do seu desligamento?"
                escalaVal={data.real_motivo_escala} justificativa={data.real_motivo_desligamento} />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Retenção</Text>
              <Pergunta numero={2} texto="O que poderia ter sido feito para evitar o seu desligamento?"
                escalaVal={data.evitaria_saida_escala} justificativa={data.o_que_evitaria_saida} />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Liderança e relações</Text>
              <Pergunta numero={3} texto="Como você avalia sua relação com sua liderança direta?"
                escalaVal={data.avaliacao_lideranca} justificativa={data.avaliacao_lideranca_just} />
              <Pergunta numero={4} texto="Como você avalia sua relação com seus colegas de trabalho?"
                escalaVal={data.avaliacao_colegas} justificativa={data.avaliacao_colegas_just} />
              <Pergunta numero={5} texto="Você recebia feedbacks com frequência?"
                escalaVal={data.recebia_feedbacks} justificativa={data.recebia_feedbacks_just} />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Clareza e direcionamento</Text>
              <Pergunta numero={6} texto="Os objetivos e metas do seu trabalho eram claros para você?"
                escalaVal={data.clareza_objetivos} justificativa={data.clareza_objetivos_just} />
              <Pergunta numero={7} texto="Suas atividades estavam alinhadas com o seu cargo?"
                escalaVal={data.atividades_alinhadas_cargo} justificativa={data.atividades_alinhadas_cargo_just} />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Desenvolvimento e carreira</Text>
              <Pergunta numero={8} texto="Como você avalia as oportunidades de crescimento e plano de carreira que a empresa oferece?"
                escalaVal={data.oportunidades_crescimento} justificativa={data.oportunidades_crescimento_just} />
              <Pergunta numero={9} texto="Como você avalia as oportunidades de treinamento e desenvolvimento que a empresa oferece?"
                escalaVal={data.oportunidades_treinamento} justificativa={data.oportunidades_treinamento_just} />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Remuneração e benefícios</Text>
              <Pergunta numero={10} texto="Como você avalia sua remuneração (salário + benefícios)?"
                escalaVal={data.avaliacao_remuneracao} justificativa={data.avaliacao_remuneracao_just} />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Estrutura e ferramentas</Text>
              <Pergunta numero={11} texto="Como você avalia as ferramentas e recursos disponibilizados para o seu trabalho?"
                escalaVal={data.avaliacao_ferramentas} justificativa={data.avaliacao_ferramentas_just} />
              <Pergunta numero={12} texto="Como você avalia a estrutura física da empresa?"
                escalaVal={data.avaliacao_estrutura_fisica} justificativa={data.avaliacao_estrutura_fisica_just} />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Ambiente e cultura</Text>
              <Pergunta numero={13} texto="Como você se sentia no ambiente de trabalho?"
                escalaVal={data.ambiente_trabalho} justificativa={data.ambiente_trabalho_just} />
            </View>

            <View style={s.section}>
              <Text style={s.sectionTitle}>Experiência geral — NPS</Text>
              <View style={s.question}>
                <Text style={s.questionText}>14. Em uma escala de 0 a 10, o quanto você recomendaria a Foco como uma boa empresa para se trabalhar?</Text>
                <View style={s.npsBox}>
                  <Text style={s.npsNumber}>{data.nps ?? '—'}</Text>
                  <Text style={s.npsLabel}>/ 10</Text>
                </View>
                {data.nps_just && (
                  <>
                    <Text style={s.justLabel}>Justificativa</Text>
                    <Text style={s.justValue}>{texto(data.nps_just)}</Text>
                  </>
                )}
              </View>
            </View>
          </>
        )}

        {/* Parecer do BP */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Parecer do BP</Text>
          <View style={s.parecerBox}>
            <Text style={s.parecerText}>{texto(data.parecer_bp)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Foco Aluguel de Carros — Entrevista de Desligamento</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  )
}
