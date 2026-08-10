import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/auth/logout/route'

describe('POST /api/auth/logout', () => {
  it('limpa o cookie de sessão', async () => {
    const res = await POST()
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.ok).toBe(true)

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('session=')
    expect(setCookie).toMatch(/max-age=0/i)
  })
})
