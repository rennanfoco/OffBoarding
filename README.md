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
- **Usuários com papéis** — contas individuais (`admin` / `comum`); administradores podem criar/remover usuários, excluir entrevistas e gerenciar os Business Partners
- **Gestão de Business Partners** — lista de BPs (usada no Passo 1 do formulário) editável pelos administradores, com opção de desativar sem apagar o histórico

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
| Testes | Vitest (unitários + integração) + GitHub Actions |

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

### 4. Crie o primeiro administrador

```bash
npm install
node scripts/seed-admin.mjs seu_usuario sua_senha
```

O script lê o `DATABASE_URL` do seu `.env.local` automaticamente. Pra apontar
pra outro banco (ex: produção), sem depender do `.env.local`, prefixe a
variável na hora de rodar:

```bash
DATABASE_URL="postgresql://usuario:senha@endpoint.rds.amazonaws.com:5432/offboarding" \
  node scripts/seed-admin.mjs seu_usuario sua_senha
```

Rodar de novo com o mesmo `usuario` reseta a senha — útil também para recuperar acesso depois.

### 5. Rode o projeto

Com `npm run dev` (usando o Postgres do passo anterior):

```bash
npm run dev
```

Ou com tudo em Docker (app + banco juntos):

```bash
docker compose -f docker-compose.dev.yml up --build
```

Acesse [http://localhost:3000](http://localhost:3000) e faça login em `/login` com o usuário criado no passo 4.

> **Importante:** sempre use `-f docker-compose.dev.yml` nos comandos de desenvolvimento (`up`, `down`, `logs`, etc). Sem essa flag, o `docker compose` usa por padrão o `docker-compose.yml` de produção. Os dois arquivos têm nomes de projeto diferentes (`offboarding-dev` e `offboarding-prod`) justamente para não conflitar entre si, mas cada um só enxerga e controla os próprios containers.

---

## Estrutura de pastas

```
app/
├── page.tsx                  # Home — menu inicial
├── login/page.tsx            # Login da área de consulta
├── entrevista/page.tsx       # Formulário de entrevista (3 passos)
├── consulta/page.tsx         # Tabela de entrevistas registradas
├── admin/
│   ├── usuarios/page.tsx     # Gestão de usuários (admin)
│   └── business-partners/page.tsx  # Gestão de BPs (admin)
└── api/
    ├── auth/                 # Login, logout e /me (dados da sessão atual)
    ├── funcionario/[cpf]/    # Busca de colaborador no TOTVS RM
    ├── entrevista/           # Salvar, gerar PDF e excluir (admin) entrevista
    ├── consulta/             # Listar e buscar entrevistas
    ├── usuarios/             # CRUD de usuários (admin)
    └── business-partners/    # CRUD de Business Partners (GET público, resto admin)

components/
├── FocoHeader.tsx            # Header com logo
├── AdminNav.tsx              # Navegação entre Entrevistas/Usuários/BPs + logout
├── EntrevistaPDF.tsx         # Template do PDF
└── ui/                       # Componentes de interface (shadcn)

lib/
├── db.ts                      # Cliente PostgreSQL (postgres.js)
├── auth.ts                    # Sessão assinada (HMAC) e helpers de verificação
├── bootstrap-admin.ts         # Cria o 1º admin automaticamente se a tabela usuarios estiver vazia
└── utils.ts                   # Utilitários (cn)

instrumentation.ts              # Hook do Next.js — roda bootstrap-admin.ts quando o servidor sobe

db/
├── schema.sql                 # Script de criação das tabelas (bancos novos)
└── migrations/                # Migrações incrementais (bancos já existentes)

scripts/
└── seed-admin.mjs             # Cria/reseta o primeiro usuário administrador

tests/
├── setup.ts                   # Carrega .env.test antes dos testes rodarem
├── helpers.ts                 # Helpers de requisição autenticada pros testes de integração
├── unit/                      # Testes unitários (sem banco/rede) — espelha lib/, app/, etc.
└── integration/               # Testes de integração (batem num Postgres real) — espelha app/api/

proxy.ts                        # Middleware do Next.js 16 — protege /consulta e /admin/*
```

---

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | String de conexão do PostgreSQL (dev local ou RDS em produção) |
| `TOTVS_RM_CPF_URL` | Endpoint do consultaSQLServer para busca por CPF |
| `TOTVS_RM_USERNAME` | Usuário da API TOTVS RM |
| `TOTVS_RM_PASSWORD` | Senha da API TOTVS RM |
| `AUTH_SECRET` | Chave que assina o cookie de sessão (use valor aleatório longo em produção) |
| `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD` | Opcionais — se definidas, o app cria esse admin sozinho ao subir contra um banco sem nenhum usuário ainda. Ver "Criando o primeiro admin sem terminal" abaixo |

Login não usa mais usuário/senha fixos em `.env` — cada pessoa tem sua própria
conta na tabela `usuarios`, criada por um admin em `/admin/usuarios` (o
primeiro admin vem do `scripts/seed-admin.mjs` ou do bootstrap automático,
ver seção de Configuração).

---

## Uso

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Menu inicial |
| `/entrevista` | Público | Formulário de registro |
| `/login` | Público | Login da área restrita |
| `/consulta` | Autenticado | Lista e busca de entrevistas; admins também veem o botão excluir |
| `/admin/usuarios` | Admin | Criar/excluir usuários |
| `/admin/business-partners` | Admin | Criar/editar/desativar Business Partners |
| `/conta` | Autenticado | Trocar a própria senha |

---

## Testes

Testes unitários (lógica pura, sem banco/rede — ex: assinatura do cookie de
sessão em `lib/auth.ts`) e de integração (chamam a função exportada da rota
de API de verdade contra um Postgres descartável), usando [Vitest](https://vitest.dev).

### Rodando localmente

```bash
# 1. Suba o banco de teste (descartável, porta 5433, dados somem a cada `up`)
docker compose -f docker-compose.test.yml up -d

# 2. Copie o arquivo de exemplo
cp .env.test.example .env.test

# 3. Rode os testes
npm test          # roda uma vez
npm run test:watch  # re-roda ao salvar (modo desenvolvimento)
```

Cada arquivo `*.test.ts` roda isolado (módulo próprio), então testes de
integração de arquivos diferentes não interferem entre si. Dentro de um
mesmo arquivo, cada teste usa nomes únicos (`Date.now()` no nome do
registro) e limpa o que criou em `afterAll`.

### CI (GitHub Actions)

Todo push e Pull Request roda `.github/workflows/ci.yml`, com 3 jobs em
paralelo: `lint`, `type-check` (`tsc --noEmit`) e `test` (sobe um Postgres de
serviço, aplica `db/schema.sql`, roda `npm test`) — mais um job de `build`
que garante que `next build` continua funcionando.

---

## Produção

Antes de subir em produção, certifique-se de:

1. Trocar `AUTH_SECRET` por uma string aleatória longa (`openssl rand -base64 32`) — trocar esse valor invalida todas as sessões ativas
2. Apontar `DATABASE_URL` para a instância RDS e rodar `db/schema.sql` nela antes do primeiro deploy (banco novo) — ou `db/migrations/001_usuarios_e_business_partners.sql` se o banco já existir
3. Criar o primeiro administrador — veja as duas opções na seção seguinte
4. Usar HTTPS (obrigatório para o cookie `secure`)
5. Gerenciar os Business Partners em `/admin/usuarios` em vez de editar código

Veja `docker-compose.yml` para o exemplo de deploy em produção (imagem publicada em registry + RDS).

### Criando o primeiro admin em produção

**Opção A — manual, via terminal**, rodando local (precisa de rede até o RDS):

```bash
DATABASE_URL="postgresql://usuario:senha@endpoint.rds.amazonaws.com:5432/offboarding" \
  node scripts/seed-admin.mjs seu_usuario sua_senha
```

**Opção B — automática, sem terminal**: defina `BOOTSTRAP_ADMIN_USERNAME` e
`BOOTSTRAP_ADMIN_PASSWORD` nas variáveis de ambiente do serviço em produção
(ex: no task definition do ECS, no console do Elastic Beanstank, etc). O
próprio app cria esse admin sozinho, uma única vez, na primeira vez que sobe
contra um banco onde a tabela `usuarios` ainda está vazia — não sobrescreve
nada se já existir algum usuário, então é seguro deixar essas variáveis
configuradas permanentemente. Ver `instrumentation.ts` e
`lib/bootstrap-admin.ts`.

Depois de criado (por qualquer uma das duas opções), confirme o login em
`/login` antes de considerar o deploy concluído.

### Se o app já está em produção (migração)

1. Rodar `db/migrations/001_usuarios_e_business_partners.sql` no RDS
2. Criar o primeiro admin (opção A ou B acima)
3. Deploy do novo código (login passa a exigir usuário cadastrado no banco)
4. Confirmar login com o admin criado
