// Hook do Next.js que roda uma única vez quando o servidor sobe, antes de
// qualquer requisição. Usado aqui só pra criar o primeiro admin automaticamente
// (veja lib/bootstrap-admin.ts) — dispensa rodar scripts/seed-admin.mjs à mão.
export async function register() {
  // Só roda no runtime Node.js (o único com acesso ao Postgres) — o
  // register() também é chamado num contexto Edge em alguns setups.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { bootstrapAdmin } = await import('./lib/bootstrap-admin')
    await bootstrapAdmin()
  }
}
