import { describe, it, expect } from 'vitest'
import { estaBloqueado, registrarFalha, limparTentativas, obterIp } from '@/lib/rate-limit'

// Cada teste usa uma chave própria (não compartilhada) para não interferir
// nos contadores dos outros testes — é a mesma Map em memória para o
// arquivo inteiro.

describe('rate-limit', () => {
  it('não bloqueia uma chave que nunca falhou', () => {
    expect(estaBloqueado('chave-nunca-usada').bloqueado).toBe(false)
  })

  it('não bloqueia enquanto estiver abaixo do limite', () => {
    const chave = 'chave-abaixo-do-limite'
    for (let i = 0; i < 4; i++) registrarFalha(chave)
    expect(estaBloqueado(chave).bloqueado).toBe(false)
  })

  it('bloqueia ao atingir o limite de tentativas', () => {
    const chave = 'chave-no-limite'
    for (let i = 0; i < 5; i++) registrarFalha(chave)
    const resultado = estaBloqueado(chave)
    expect(resultado.bloqueado).toBe(true)
    expect(resultado.retryAfterSegundos).toBeGreaterThan(0)
  })

  it('limparTentativas desbloqueia a chave', () => {
    const chave = 'chave-para-limpar'
    for (let i = 0; i < 5; i++) registrarFalha(chave)
    expect(estaBloqueado(chave).bloqueado).toBe(true)

    limparTentativas(chave)
    expect(estaBloqueado(chave).bloqueado).toBe(false)
  })

  it('chaves diferentes não se afetam', () => {
    const chaveA = 'chave-isolada-a'
    const chaveB = 'chave-isolada-b'
    for (let i = 0; i < 5; i++) registrarFalha(chaveA)

    expect(estaBloqueado(chaveA).bloqueado).toBe(true)
    expect(estaBloqueado(chaveB).bloqueado).toBe(false)
  })

  describe('obterIp', () => {
    it('usa o primeiro IP do x-forwarded-for quando presente', () => {
      const req = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '203.0.113.5, 10.0.0.1' },
      })
      expect(obterIp(req)).toBe('203.0.113.5')
    })

    it('retorna "desconhecido" quando o header não existe', () => {
      const req = new Request('http://localhost')
      expect(obterIp(req)).toBe('desconhecido')
    })
  })
})
