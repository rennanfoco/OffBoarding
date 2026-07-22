# Entrevista de Desligamento — Foco Aluguel de Carros

Sistema web interno para registro e consulta de entrevistas de desligamento, utilizado pelo time de Business Partners (BP).

---

## Funcionalidades

- **Registro de entrevista** — formulário em 3 passos preenchido pelo BP:
  - Passo 1: Identificação do colaborador (busca automática via CPF no TOTVS RM; gestor imediato é digitado manualmente, pois não vem do TOTVS)
  - Passo 2: Q1 e Q2 são perguntas abertas (texto livre); Q3–Q13 usam escala (Ótimo / Bom / Regular / Ruim) + justificativa; Q14 é o NPS (nota de 0 a 10)
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
| Banco de dados | PostgreSQL direto (postgres.js) |
| PDF | @react-pdf/renderer |
| Fonte | Omnes Sans (local) |
| Deploy | Docker (dev com Postgres local, prod com RDS) |

---

## Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/offboarding.git
cd offboarding
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com os valores reais:

```bash
cp .env.example .env.local
```

Edite `.env.local` com as credenciais do banco, TOTVS RM e autenticação. Veja detalhes no próprio arquivo.

### 3. Suba o banco de dados (Docker)

```bash
docker compose -f docker-compose.dev.yml up -d db
```

Isso sobe um Postgres local na porta 5432 e já roda `db/schema.sql` para criar a tabela automaticamente. Aponte o `DATABASE_URL` do `.env.local` para ele:

```
DATABASE_URL=postgresql://offboarding:offboarding@localhost:5432/offboarding
```

### 4. Rode o projeto

Com `npm run dev` (usando o Postgres do passo anterior):

```bash
npm install
npm run dev
```

Ou com tudo em Docker (app + banco juntos):

```bash
docker compose -f docker-compose.dev.yml up --build
```

Acesse [http://localhost:3000](http://localhost:3000).

> **Importante:** sempre use `-f docker-compose.dev.yml` nos comandos de desenvolvimento (`up`, `down`, `logs`, etc). Sem essa flag, o `docker compose` usa por padrão o `docker-compose.yml` de produção. Os dois arquivos têm nomes de projeto diferentes (`offboarding-dev` e `offboarding-prod`) justamente para não conflitar entre si, mas cada um só enxerga e controla os próprios containers.

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
├── db.ts                      # Cliente PostgreSQL (postgres.js)
├── auth.ts                    # Helper de verificação de sessão
└── utils.ts                   # Utilitários (cn)

db/
└── schema.sql                 # Script de criação da tabela

proxy.ts                        # Middleware do Next.js 16 — protege /consulta (redireciona para /login sem sessão válida)
```

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão do PostgreSQL (dev local ou RDS em produção) |
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
3. Apontar `DATABASE_URL` para a instância RDS e rodar `db/schema.sql` nela antes do primeiro deploy
4. Usar HTTPS (obrigatório para o cookie `secure`)
5. Atualizar a lista de BPs em `app/entrevista/page.tsx` → `LISTA_BPS`

Veja `docker-compose.yml` para o exemplo de deploy em produção (imagem publicada em registry + RDS).
