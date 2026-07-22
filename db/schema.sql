-- Tabela: entrevistas de desligamento (preenchida pelo BP)
CREATE TABLE entrevistas_desligamento (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Identificação (auto-preenchida via CPF + TOTVS)
  cpf             TEXT NOT NULL,
  nome            TEXT NOT NULL,
  data_nascimento DATE,
  cargo           TEXT,
  tempo_empresa   TEXT,
  loja_area       TEXT,
  gestor_imediato TEXT,

  -- Passo 1
  bp_responsavel       TEXT NOT NULL,
  motivo_saida         TEXT NOT NULL,
  entrevista_realizada TEXT NOT NULL CHECK (entrevista_realizada IN (
    'sim_realizada',
    'nao_recusou',
    'nao_decisao_empresa',
    'nao_nao_respondeu',
    'nao_sem_contato'
  )),

  -- Passo 2: Motivo do desligamento (Q1 — resposta aberta)
  real_motivo_desligamento TEXT,

  -- Passo 2: Retenção (Q2 — resposta aberta)
  o_que_evitaria_saida TEXT,

  -- Passo 2: Liderança e relações (Q3-Q5)
  avaliacao_lideranca      TEXT CHECK (avaliacao_lideranca      IN ('otimo','bom','regular','ruim')),
  avaliacao_lideranca_just TEXT,
  avaliacao_colegas        TEXT CHECK (avaliacao_colegas        IN ('otimo','bom','regular','ruim')),
  avaliacao_colegas_just   TEXT,
  recebia_feedbacks        TEXT CHECK (recebia_feedbacks        IN ('otimo','bom','regular','ruim')),
  recebia_feedbacks_just   TEXT,

  -- Passo 2: Clareza e direcionamento (Q6-Q7)
  clareza_objetivos               TEXT CHECK (clareza_objetivos               IN ('otimo','bom','regular','ruim')),
  clareza_objetivos_just          TEXT,
  atividades_alinhadas_cargo      TEXT CHECK (atividades_alinhadas_cargo      IN ('otimo','bom','regular','ruim')),
  atividades_alinhadas_cargo_just TEXT,

  -- Passo 2: Desenvolvimento e carreira (Q8-Q9)
  oportunidades_crescimento      TEXT CHECK (oportunidades_crescimento      IN ('otimo','bom','regular','ruim')),
  oportunidades_crescimento_just TEXT,
  oportunidades_treinamento      TEXT CHECK (oportunidades_treinamento      IN ('otimo','bom','regular','ruim')),
  oportunidades_treinamento_just TEXT,

  -- Passo 2: Remuneração e benefícios (Q10)
  avaliacao_remuneracao      TEXT CHECK (avaliacao_remuneracao      IN ('otimo','bom','regular','ruim')),
  avaliacao_remuneracao_just TEXT,

  -- Passo 2: Estrutura e ferramentas (Q11-Q12)
  avaliacao_ferramentas           TEXT CHECK (avaliacao_ferramentas           IN ('otimo','bom','regular','ruim')),
  avaliacao_ferramentas_just      TEXT,
  avaliacao_estrutura_fisica      TEXT CHECK (avaliacao_estrutura_fisica      IN ('otimo','bom','regular','ruim')),
  avaliacao_estrutura_fisica_just TEXT,

  -- Passo 2: Ambiente e cultura (Q13)
  ambiente_trabalho      TEXT CHECK (ambiente_trabalho      IN ('otimo','bom','regular','ruim')),
  ambiente_trabalho_just TEXT,

  -- Passo 2: Experiência geral / NPS (Q14)
  nps      INTEGER CHECK (nps BETWEEN 0 AND 10),
  nps_just TEXT,

  -- Passo 3: Parecer do BP
  parecer_bp TEXT,

  criado_em TIMESTAMPTZ DEFAULT NOW()
);
