/**
 * Limitador de tentativas em memória, pensado para o login. Guarda um
 * contador por "chave" (normalmente `ip:usuario`) numa Map em memória do
 * próprio processo Node.
 *
 * Limitação conhecida: como o contador vive só na memória do processo, se o
 * deploy rodar múltiplas réplicas atrás de um load balancer, cada réplica
 * conta separado — o limite efetivo vira (MAX_TENTATIVAS × réplicas). Um
 * store compartilhado (Redis, por exemplo) resolveria isso de vez; fica
 * registrado como próximo passo quando a infra crescer para várias
 * instâncias. Para uma única instância (cenário atual), funciona bem.
 */

type Registro = {
  tentativas: number
  resetEm:    number // epoch ms em que a janela atual expira
}

const MAX_TENTATIVAS = 5
const JANELA_MS = 15 * 60 * 1000 // 15 minutos

const tentativas = new Map<string, Registro>()

function limparExpirados(agora: number): void {
  for (const [chave, registro] of tentativas) {
    if (agora > registro.resetEm) tentativas.delete(chave)
  }
}

/** Registra uma tentativa falha para a chave informada. */
export function registrarFalha(chave: string): void {
  const agora = Date.now()

  // Faxina oportunista: sem isso a Map só cresce (chaves de quem nunca mais
  // tentou de novo ficariam para sempre). Não precisa ser em toda chamada,
  // só o suficiente para não acumular memória indefinidamente.
  if (Math.random() < 0.01) limparExpirados(agora)

  const registro = tentativas.get(chave)
  if (!registro || agora > registro.resetEm) {
    tentativas.set(chave, { tentativas: 1, resetEm: agora + JANELA_MS })
    return
  }

  registro.tentativas += 1
}

/** Limpa o contador de uma chave (chamar depois de um login bem-sucedido). */
export function limparTentativas(chave: string): void {
  tentativas.delete(chave)
}

/** Verifica se a chave está temporariamente bloqueada por excesso de tentativas. */
export function estaBloqueado(chave: string): { bloqueado: boolean; retryAfterSegundos?: number } {
  const registro = tentativas.get(chave)
  if (!registro) return { bloqueado: false }

  const agora = Date.now()
  if (agora > registro.resetEm) {
    tentativas.delete(chave)
    return { bloqueado: false }
  }

  if (registro.tentativas >= MAX_TENTATIVAS) {
    return { bloqueado: true, retryAfterSegundos: Math.ceil((registro.resetEm - agora) / 1000) }
  }

  return { bloqueado: false }
}

/** Extrai o IP do cliente a partir do header padrão de proxy/load balancer. */
export function obterIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return 'desconhecido'
}
