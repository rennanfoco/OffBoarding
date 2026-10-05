'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FocoHeader } from '@/components/FocoHeader'
import { AdminNav } from '@/components/AdminNav'

type Exclusao = {
  id:            string
  nome:          string
  cpf_mascarado: string
  excluido_por:  string
  excluido_em:   string
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ExclusoesPage() {
  const router = useRouter()

  const [role,       setRole]       = useState<'admin' | 'editor' | 'comum' | null>(null)
  const [exclusoes,  setExclusoes]  = useState<Exclusao[]>([])
  const [carregando, setCarregando] = useState(true)

  async function init() {
    const me = await fetch('/api/auth/me')
    if (me.status === 401) { router.push('/login'); return }
    const meJson = await me.json()
    if (meJson.role !== 'admin') { router.push('/consulta'); return }
    setRole(meJson.role)

    try {
      const res = await fetch('/api/exclusoes')
      if (res.status === 401) { router.push('/login'); return }
      const json = await res.json()
      setExclusoes(json.exclusoes ?? [])
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { init() }, [])

  if (!role) return null

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <FocoHeader />
      <main className="flex-1 py-8 px-6 md:px-12 lg:px-20 xl:px-28">
        <div className="max-w-6xl space-y-6">

          <AdminNav role={role} />

          <div>
            <h1 className="text-2xl font-bold">Entrevistas excluídas</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Registro de quem excluiu cada entrevista e quando. É só um log: não guarda
              o conteúdo da entrevista, e o CPF aparece mascarado.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entrevista de</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">CPF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Excluída por</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {carregando && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
                  )}
                  {!carregando && exclusoes.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhuma entrevista foi excluída até agora.</td></tr>
                  )}
                  {!carregando && exclusoes.map((x, i) => (
                    <tr key={x.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-4 py-3 font-medium">{x.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{x.cpf_mascarado}</td>
                      <td className="px-4 py-3">{x.excluido_por}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(x.excluido_em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
