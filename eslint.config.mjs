import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
  {
    rules: {
      // Regra do React Compiler que reprova o padrão "buscar dados num
      // useEffect ao montar o componente" — usado deliberadamente em várias
      // páginas do projeto (login, entrevista, consulta, admin/*). Migrar
      // pra Server Components/outra abordagem é uma refatoração maior,
      // fora do escopo de configurar a pipeline de testes — mantido como
      // aviso em vez de erro pra não travar o CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
