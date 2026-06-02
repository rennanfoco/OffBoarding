'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { FocoHeader } from '@/components/FocoHeader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Entrevista = {
  id:                   string
  nome:                 string
  cpf:                  string
  cargo:                string
  loja_area:            string
  bp_responsavel:       string
  motivo_saida:         string
  entrevista_realizada: string
  criado_em:            string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  sim_realizada:       'Realizada',
  nao_recusou:         'Não – recusou',
  nao_decisao_empresa: 'Não – decisão empresa',
  nao_nao_respondeu:   'Não – não respondeu',
  nao_sem_contato:     'Não – sem contato',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function mascaraCpf(cpf: string) {
  const c = cpf.replace(/\D/g, '')
  if (c.length !== 11) return cpf
  return `${c.slice(0, 3)}.${c.slice(3, 6)}.***.${c.slice(9)}`
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ConsultaPage() {
  const router = useRouter()

  const [entrevistas, setEntrevistas] = useState<Entrevista[]>([])
  const [carregando,  setCarregando]  = useState(true)
  const [busca,       setBusca]       = useState('')
  const [baixando,    setBaixando]    = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carrega todas as entrevistas na entrada
  useEffect(() => { buscar('') }, [])

  async function buscar(q: string) {
    setCarregando(true)
    try {
      const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
      const res    = await fetch(`/api/consulta${params}`)
      if (res.status === 401) { router.push('/login'); return }
      const json   = await res.json()
      setEntrevistas(json.entrevistas ?? [])
    } finally {
      setCarregando(false)
    }
  }

  function handleBusca(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setBusca(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscar(val), 400)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function baixarPdf(id: string, nome: string) {
    setBaixando(id)
    try {
      const res = await fetch(`/api/entrevista/pdf/${id}`)
      if (!res.ok) { alert('Erro ao gerar o PDF.'); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `entrevista-${nome.replace(/\s+/g, '-').toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setBaixando(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <FocoHeader />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Título + logout */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Entrevistas de Desligamento</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {carregando ? 'Carregando...' : `${entrevistas.length} registro${entrevistas.length !== 1 ? 's' : ''} encontrado${entrevistas.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>

          {/* Campo de busca */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={busca}
                onChange={handleBusca}
                className="max-w-sm"
              />
            </CardContent>
          </Card>

          {/* Tabela */}
          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">CPF</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cargo</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Loja / Área</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">BP</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Motivo</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Entrevista</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {carregando && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                        Carregando...
                      </td>
                    </tr>
                  )}
                  {!carregando && entrevistas.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhuma entrevista encontrada.
                      </td>
                    </tr>
                  )}
                  {!carregando && entrevistas.map((e, i) => (
                    <tr
                      key={e.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/10'}`}
                    >
                      <td className="px-4 py-3 font-medium">{e.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{mascaraCpf(e.cpf)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.cargo || '—'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.loja_area || '—'}</td>
                      <td className="px-4 py-3">{e.bp_responsavel}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[160px] truncate" title={e.motivo_saida}>
                        {e.motivo_saida}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={e.entrevista_realizada === 'sim_realizada' ? 'default' : 'outline'}
                          className="whitespace-nowrap"
                        >
                          {STATUS_LABEL[e.entrevista_realizada] ?? e.entrevista_realizada}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(e.criado_em)}
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={baixando === e.id}
                          onClick={() => baixarPdf(e.id, e.nome)}
                        >
                          {baixando === e.id ? '...' : '⬇ PDF'}
                        </Button>
                      </td>
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
