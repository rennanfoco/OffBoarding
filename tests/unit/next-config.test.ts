import { describe, it, expect } from 'vitest'
import nextConfig from '@/next.config'

describe('next.config headers()', () => {
  it('aplica os headers de segurança a todas as rotas', async () => {
    const resultado = await nextConfig.headers!()
    expect(resultado).toHaveLength(1)
    expect(resultado[0].source).toBe('/:path*')

    const valores = Object.fromEntries(resultado[0].headers.map((h) => [h.key, h.value]))

    expect(valores['X-Frame-Options']).toBe('DENY')
    expect(valores['X-Content-Type-Options']).toBe('nosniff')
    expect(valores['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(valores['Strict-Transport-Security']).toContain('max-age=')
    expect(valores['Content-Security-Policy']).toContain("default-src 'self'")
    expect(valores['Content-Security-Policy']).toContain("frame-ancestors 'none'")
  })
})
