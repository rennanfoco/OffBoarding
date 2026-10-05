import { describe, it, expect } from 'vitest'
import { mascararCpf } from '@/lib/utils'

describe('mascararCpf', () => {
  it('mascara o miolo do CPF', () => {
    expect(mascararCpf('07700412300')).toBe('077.004.***.00')
  })

  it('aceita CPF já formatado', () => {
    expect(mascararCpf('077.004.123-00')).toBe('077.004.***.00')
  })

  it('devolve o valor original se não tiver 11 dígitos', () => {
    expect(mascararCpf('123')).toBe('123')
  })
})
