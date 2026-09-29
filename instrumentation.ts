// Hook do Next.js que roda uma única vez quando o servidor sobe, antes de
// qualquer requisição. Usado aqui pra: 1) aplicar migrações pendentes de
// db/migrations/ automaticamente (dispensa rodar `psql -f ...` à mão a cada
// deploy) e 2) criar o primeiro admin automaticamente (veja
// lib/bootstrap-admin.ts) — dispensa rodar scripts/seed-admin.mjs à mão.
export async function register() {
  // Só roda no runtime Node.js (o único com acesso ao Postgres) — o
  // register() também é chamado num contexto Edge em alguns setups.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { aplicarMigrations } = await import('./lib/migrate')
    try {
      await aplicarMigrations()
    } catch (e) {
      // Não derruba o app por isso — rotas que não dependem da migração
      // pendente continuam funcionando; só loga bem visível pra quem for
      // investigar um erro de "coluna não existe" saber a causa raiz.
      console.error('[migrate] Falha ao aplicar migrações automáticas:', e)
    }

    const { bootstrapAdmin } = await import('./lib/bootstrap-admin')
    await bootstrapAdmin()
  }
}
