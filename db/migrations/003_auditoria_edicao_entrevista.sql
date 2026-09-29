-- Migração para bancos já existentes (produção). Idempotente — pode rodar mais de uma vez.
--
-- Uso:
--   psql "postgresql://usuario:senha@host:5432/offboarding" -f db/migrations/003_auditoria_edicao_entrevista.sql
--
-- Permite que admins editem entrevistas já salvas (PUT /api/entrevista/[id]).
-- Essas duas colunas guardam quem editou e quando — a entrevista continua
-- sendo criada só pelo BP responsável, isso aqui é só o rastro da edição.

ALTER TABLE entrevistas_desligamento ADD COLUMN IF NOT EXISTS editado_por TEXT;
ALTER TABLE entrevistas_desligamento ADD COLUMN IF NOT EXISTS editado_em  TIMESTAMPTZ;
