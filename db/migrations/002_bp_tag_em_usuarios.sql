-- Migração para bancos já existentes (produção). Idempotente — pode rodar mais de uma vez.
--
-- Uso:
--   psql "postgresql://usuario:senha@host:5432/offboarding" -f db/migrations/002_bp_tag_em_usuarios.sql
--
-- Troca o modelo de Business Partners: em vez de uma tabela solta
-- (business_partners), BP vira uma marcação (is_business_partner) na própria
-- conta de usuário. Quem tiver essa marcação consegue acessar /entrevista, e
-- o nome do BP na entrevista passa a vir da conta logada, não de um dropdown.
--
-- Seguro dropar business_partners: não há FK dela com entrevistas_desligamento
-- (bp_responsavel sempre foi TEXT solto) — entrevistas já salvas não são afetadas.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nome TEXT;
UPDATE usuarios SET nome = usuario WHERE nome IS NULL;
ALTER TABLE usuarios ALTER COLUMN nome SET NOT NULL;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS is_business_partner BOOLEAN NOT NULL DEFAULT false;

DROP TABLE IF EXISTS business_partners;
