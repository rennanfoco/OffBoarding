import type { NextConfig } from "next";

// Headers de segurança aplicados a toda resposta, em toda rota — via
// next.config em vez do proxy.ts porque o matcher do proxy só cobre um
// subconjunto de páginas (/consulta, /admin, /conta, /entrevista); headers()
// do Next roda pra tudo, incluindo /login e as rotas de /api.
const HEADERS_SEGURANCA = [
  // Impede que o site seja carregado dentro de um <iframe> de outra origem
  // (clickjacking).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Impede que o navegador tente "adivinhar" o tipo de um arquivo diferente
  // do Content-Type declarado.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Não vaza a URL completa de origem em navegações entre origens diferentes.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Desliga o acesso a APIs sensíveis do navegador que o app não usa.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Força HTTPS por 2 anos (só tem efeito se o site já for servido em HTTPS).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  // Content-Security-Policy: restringe de onde o navegador pode carregar
  // script/estilo/imagem/etc. 'unsafe-inline' em script/style ainda é
  // necessário aqui (hidratação do React e estilos do Tailwind injetam
  // inline) — uma versão mais estrita exigiria CSP baseada em nonce por
  // requisição, o que é um passo à parte.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: HEADERS_SEGURANCA,
      },
    ]
  },
};

export default nextConfig;
