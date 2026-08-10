-- Migração para bancos já existentes (produção). Idempotente — pode rodar mais de uma vez.
--
-- Uso:
--   psql "postgresql://usuario:senha@host:5432/offboarding" -f db/migrations/001_usuarios_e_business_partners.sql
--
-- Depois de rodar esta migração, crie o primeiro administrador com:
--   DATABASE_URL="postgresql://..." node scripts/seed-admin.mjs usuario senha123

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','comum')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO business_partners (nome) VALUES
  ('Geovany Araujo'),
  ('Henmilly Vitória'),
  ('Rafaela Alessandra')
ON CONFLICT (nome) DO NOTHING;
