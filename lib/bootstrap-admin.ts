import bcrypt from 'bcryptjs'
import sql from './db'

/**
 * Cria o primeiro administrador automaticamente, mas só se não existir
 * nenhum admin ainda (não olha usuários comuns — cobre tanto o banco
 * totalmente novo quanto um estado "travado" onde só sobraram usuários
 * comuns e ninguém consegue mais gerenciar o sistema). Não faz nada se já
 * existir algum admin, e não faz nada se as variáveis de ambiente de
 * bootstrap não estiverem configuradas.
 *
 * Existe pra permitir subir em produção sem precisar rodar
 * `scripts/seed-admin.mjs` manualmente via terminal — configure
 * BOOTSTRAP_ADMIN_USERNAME/BOOTSTRAP_ADMIN_PASSWORD no ambiente e o próprio
 * app cria o admin na primeira vez que sobe sem nenhum admin cadastrado.
 */
export async function bootstrapAdmin() {
  const usuario = process.env.BOOTSTRAP_ADMIN_USERNAME
  const senha   = process.env.BOOTSTRAP_ADMIN_PASSWORD

  if (!usuario || !senha) return // bootstrap não configurado — segue o jogo

  try {
    const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM usuarios WHERE role = 'admin'`
    if (count > 0) return // já existe pelo menos um admin, nunca sobrescreve

    const senhaHash = await bcrypt.hash(senha, 10)
    // nome não é coletado separadamente aqui — usa o próprio usuário como nome
    await sql`
      INSERT INTO usuarios (usuario, nome, senha_hash, role)
      VALUES (${usuario}, ${usuario}, ${senhaHash}, 'admin')
    `
    console.log(`[bootstrap-admin] Administrador "${usuario}" criado automaticamente.`)
  } catch (e) {
    // Não derruba o app se isso falhar (ex: banco ainda subindo) — só loga.
    console.error('[bootstrap-admin] Falha ao criar o administrador inicial:', e)
  }
}
