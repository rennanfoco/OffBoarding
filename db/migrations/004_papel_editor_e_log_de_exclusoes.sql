-- Migração para bancos já existentes (produção). Idempotente — pode rodar mais de uma vez.
--
-- 1) Terceiro papel de usuário, "editor": pode editar e excluir entrevistas já
--    salvas (como o admin), mas não gerencia usuários. Hierarquia:
--    comum < editor < admin.
-- 2) Log de exclusões: excluir uma entrevista é irreversível, então fica
--    registrado quem excluiu e quando. É um log, não um backup — guarda só o
--    mínimo pra identificar o que foi removido (nome e CPF mascarado), não o
--    conteúdo da entrevista nem o CPF inteiro.

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_role_check;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_role_check CHECK (role IN ('admin','editor','comum'));

CREATE TABLE IF NOT EXISTS entrevistas_excluidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entrevista_id UUID NOT NULL,
  nome          TEXT NOT NULL,
  cpf_mascarado TEXT NOT NULL,
  excluido_por  TEXT NOT NULL,
  excluido_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
