import { describe, it, expect } from 'vitest'
import { proxy } from '@/proxy'
import { reqComoAdmin, reqComoComum, reqComoBP, reqSemSessao } from '@/tests/helpers'

describe('proxy', () => {
  it('sem sessão, redireciona pro login preservando a rota de origem', async () => {
    const res = await proxy(reqSemSessao('http://localhost/consulta'))
    expect(res.status).toBe(307)
    const location = new URL(res.headers.get('location')!)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('from')).toBe('/consulta')
  })

  it('usuário comum tentando acessar /admin é redirecionado pra /consulta', async () => {
    const res = await proxy(await reqComoComum('http://localhost/admin/usuarios'))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/consulta')
  })

  it('admin acessa /admin normalmente', async () => {
    const res = await proxy(await reqComoAdmin('http://localhost/admin/usuarios'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('BP acessa /entrevista normalmente', async () => {
    const res = await proxy(await reqComoBP('http://localhost/entrevista'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('admin sem a tag de BP também acessa /entrevista (visualização, envio é bloqueado à parte)', async () => {
    const res = await proxy(await reqComoAdmin('http://localhost/entrevista'))
    expect(res.headers.get('location')).toBeNull()
  })

  it('usuário comum sem BP e sem admin é redirecionado de /entrevista pra /consulta', async () => {
    const res = await proxy(await reqComoComum('http://localhost/entrevista'))
    expect(res.status).toBe(307)
    expect(new URL(res.headers.get('location')!).pathname).toBe('/consulta')
  })
})
