'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EntrevistaForm } from '@/components/EntrevistaForm'
import { FocoHeader } from '@/components/FocoHeader'

type Status = 'carregando' | 'ok' | 'nao_encontrada' | 'erro'

export default function EditarEntrevistaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [status, setStatus] = useState<Status>('carregando')
  const [dados,  setDados]  = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    fetch(`/api/entrevista/${id}`)
      .then(async (res) => {
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 403) { router.push('/consulta'); return }
        if (res.status === 404) { setStatus('nao_encontrada'); return }
        if (!res.ok) { setStatus('erro'); return }
        const json = await res.json()
        setDados(json.entrevista)
        setStatus('ok')
      })
      .catch(() => setStatus('erro'))
  }, [id, router])

  if (status === 'carregando') {
    return (
      <div className="min-h-screen flex flex-col bg-muted/40">
        <FocoHeader />
        <main className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Carregando entrevista...
        </main>
      </div>
    )
  }

  if (status === 'nao_encontrada' || status === 'erro') {
    return (
      <div className="min-h-screen flex flex-col bg-muted/40">
        <FocoHeader />
        <main className="flex-1 flex items-center justify-center text-sm text-destructive">
          {status === 'nao_encontrada' ? 'Entrevista não encontrada.' : 'Erro ao carregar a entrevista.'}
        </main>
      </div>
    )
  }

  return <EntrevistaForm modo="editar" entrevistaId={id} dadosIniciais={dados ?? undefined} />
}
