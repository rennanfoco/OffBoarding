# Entrevista de Desligamento — Foco Aluguel de Carros

Sistema web interno para registro e consulta de entrevistas de desligamento, utilizado pelo time de Business Partners (BP).

---

## Funcionalidades

- **Registro de entrevista** — formulário em 3 passos preenchido pelo BP:
  - Passo 1: Identificação do colaborador (busca automática via CPF no TOTVS RM)
  - Passo 2: Perguntas estruturadas com escala (Ótimo / Bom / Regular / Ruim) + justificativa
  - Passo 3: Parecer do BP
- **Consulta de entrevistas** — área protegida por login com tabela pesquisável por nome ou CPF e download de PDF por registro
- **Geração de PDF** — relatório completo da entrevista gerado no servidor

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| UI | React 19 + Tailwind CSS 4 + Base UI |
| Formulários | React Hook Form + Zod |
| Banco de dados | Supabase (PostgreSQL) |
| PDF | @react-pdf/renderer |
| Fonte | Omnes Sans (local) |

---

## Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/offboarding.git
cd offboarding
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com os valores reais:

```bash
cp .env.example .env.local
```

Edite `.env.local` com as credenciais do Supabase, TOTVS RM e autenticação. Veja detalhes no próprio arquivo.

### 4. Crie a tabela no Supabase

Acesse o painel do Supabase → **SQL Editor** → cole e execute o conteúdo de `supabase/schema.sql`.

### 5. Rode o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Estrutura de pastas

```
app/
├── page.tsx                  # Home — menu inicial
├── login/page.tsx            # Login da área de consulta
├── entrevista/page.tsx       # Formulário de entrevista (3 passos)
├── consulta/page.tsx         # Tabela de entrevistas registradas
└── api/
    ├── auth/                 # Login e logout (cookie httpOnly)
    ├── funcionario/[cpf]/    # Busca de colaborador no TOTVS RM
    ├── entrevista/           # Salvar entrevista + gerar PDF
    └── consulta/             # Listar e buscar entrevistas

components/
├── FocoHeader.tsx            # Header com logo
├── EntrevistaPDF.tsx         # Template do PDF
└── ui/                       # Componentes de interface (shadcn)

lib/
├── supabase.ts               # Cliente Supabase
├── auth.ts                   # Helper de verificação de sessão
└── utils.ts                  # Utilitários (cn)

supabase/
└── schema.sql                # Script de criação da tabela
```

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `TOTVS_RM_CPF_URL` | Endpoint do consultaSQLServer para busca por CPF |
| `TOTVS_RM_USERNAME` | Usuário da API TOTVS RM |
| `TOTVS_RM_PASSWORD` | Senha da API TOTVS RM |
| `AUTH_USERNAME` | Usuário de acesso à área de consulta |
| `AUTH_PASSWORD` | Senha de acesso à área de consulta |
| `AUTH_SECRET` | Segredo do cookie de sessão (use valor aleatório longo em produção) |

---

## Uso

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Menu inicial |
| `/entrevista` | Público | Formulário de registro |
| `/login` | Público | Login da área restrita |
| `/consulta` | Autenticado | Lista e busca de entrevistas |

---

## Produção

Antes de subir em produção, certifique-se de:

1. Trocar `AUTH_SECRET` por uma string aleatória longa (`openssl rand -base64 32`)
2. Atualizar `AUTH_USERNAME` e `AUTH_PASSWORD` com credenciais seguras
3. Habilitar RLS (Row Level Security) no Supabase
4. Usar HTTPS (obrigatório para o cookie `secure`)
5. Atualizar a lista de BPs em `app/entrevista/page.tsx` → `LISTA_BPS`
