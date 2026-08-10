import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    setupFiles: ['./tests/setup.ts'],
    // Os testes de integração compartilham o mesmo Postgres de teste — rodar
    // arquivos em paralelo abriria brecha pra condição de corrida entre eles
    // (ex: um teste que depende da tabela estar totalmente vazia).
    fileParallelism: false,
    coverage: {
      provider:  'v8',
      reporter:  ['text', 'html'],
      // Só o código que a gente realmente escreve — sem isso o relatório
      // mistura configs, componentes de UI puros (shadcn) e o próprio setup
      // de teste, o que distorce o número pra baixo sem dizer nada útil.
      include: ['app/api/**', 'lib/**', 'proxy.ts'],
      exclude: ['**/*.test.ts', 'tests/**'],
    },
  },
})
