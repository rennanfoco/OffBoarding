'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FocoHeader } from '@/components/FocoHeader'
import { AdminNav } from '@/components/AdminNav'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Usuario = {
  id:                  string
  usuario:             string
  nome:                string
  role:                'admin' | 'comum'
  is_business_partner: boolean
  criado_em:           string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function UsuariosPage() {
  const router = useRouter()

  const [role,      setRole]      = useState<'admin' | 'comum' | null>(null)
  const [usuarios,  setUsuarios]  = useState<Usuario[]>([])
  const [carregando, setCarregando] = useState(true)

  const [usuarioNovo, setUsuarioNovo] = useState('')
  const [nomeNovo,    setNomeNovo]    = useState('')
  const [senha,      setSenha]      = useState('')
  const [novoRole,   setNovoRole]   = useState<'admin' | 'comum'>('comum')
  const [novoBp,     setNovoBp]     = useState(false)
  const [criando,    setCriando]    = useState(false)
  const [erro,       setErro]       = useState('')
  const [excluindo,  setExcluindo]  = useState<string | null>(null)

  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [nomeEdit,    setNomeEdit]   = useState('')
  const [salvando,    setSalvando]   = useState<string | null>(null)

  async function carregarUsuarios() {
    setCarregando(true)
    try {
      const res  = await fetch('/api/usuarios')
      if (res.status === 401) { router.push('/login'); return }
      const json = await res.json()
      setUsuarios(json.usuarios ?? [])
    } finally {
      setCarregando(false)
    }
  }

  async function init() {
    const me = await fetch('/api/auth/me')
    if (me.status === 401) { router.push('/login'); return }
    const meJson = await me.json()
    if (meJson.role !== 'admin') { router.push('/consulta'); return }
    setRole(meJson.role)
    await carregarUsuarios()
  }

  useEffect(() => { init() }, [])

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCriando(true)
    try {
      const res = await fetch('/api/usuarios', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          usuario: usuarioNovo,
          nome:    nomeNovo,
          senha,
          role:    novoRole,
          is_business_partner: novoBp,
        }),
      })
      if (!res.ok) {
        const json = await res.json()
        setErro(json.error ?? 'Erro ao criar usuário.')
        return
      }
      setUsuarioNovo(''); setNomeNovo(''); setSenha(''); setNovoRole('comum'); setNovoBp(false)
      await carregarUsuarios()
    } finally {
      setCriando(false)
    }
  }

  async function handleExcluir(id: string, usuario: string) {
    if (!confirm(`Excluir o usuário "${usuario}"? Essa ação não pode ser desfeita.`)) return
    setExcluindo(id)
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        alert(json.error ?? 'Erro ao excluir usuário.')
        return
      }
      await carregarUsuarios()
    } finally {
      setExcluindo(null)
    }
  }

  function iniciarEdicao(u: Usuario) {
    setEditandoId(u.id)
    setNomeEdit(u.nome)
  }

  async function salvarNome(id: string) {
    setSalvando(id)
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nome: nomeEdit }),
      })
      if (!res.ok) {
        const json = await res.json()
        alert(json.error ?? 'Erro ao salvar.')
        return
      }
      setEditandoId(null)
      await carregarUsuarios()
    } finally {
      setSalvando(null)
    }
  }

  async function alternarBp(u: Usuario) {
    setSalvando(u.id)
    try {
      const res = await fetch(`/api/usuarios/${u.id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ is_business_partner: !u.is_business_partner }),
      })
      if (!res.ok) {
        const json = await res.json()
        alert(json.error ?? 'Erro ao atualizar.')
        return
      }
      await carregarUsuarios()
    } finally {
      setSalvando(null)
    }
  }

  if (!role) return null

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">
      <FocoHeader />
      <main className="flex-1 py-8 px-6 md:px-12 lg:px-20 xl:px-28">
        <div className="max-w-6xl space-y-6">

          <AdminNav role={role} />

          <div>
            <h1 className="text-2xl font-bold">Usuários</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie quem tem acesso à área de consulta e quem pode preencher
              entrevistas de desligamento (marcação de Business Partner).
            </p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Novo usuário</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCriar} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="nomeNovo">Nome</Label>
                  <Input id="nomeNovo" value={nomeNovo} onChange={(e) => setNomeNovo(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="usuarioNovo">Usuário</Label>
                  <Input id="usuarioNovo" value={usuarioNovo} onChange={(e) => setUsuarioNovo(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-1">
                  <Label>Papel</Label>
                  <Select value={novoRole} onValueChange={(v) => setNovoRole(v as 'admin' | 'comum')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comum">Comum</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoBp}
                      onChange={(e) => setNovoBp(e.target.checked)}
                      className="accent-primary"
                    />
                    Também é Business Partner (pode preencher entrevistas de desligamento)
                  </label>
                </div>

                {erro && <p className="text-sm text-destructive sm:col-span-2">{erro}</p>}

                <div className="sm:col-span-2">
                  <Button type="submit" disabled={criando}>
                    {criando ? 'Criando...' : 'Criar usuário'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="rounded-xl overflow-hidden ring-1 ring-foreground/10 bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Papel</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">BP</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Criado em</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {carregando && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Carregando...</td></tr>
                  )}
                  {!carregando && usuarios.map((u, i) => (
                    <tr key={u.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                      <td className="px-4 py-3 font-medium">
                        {editandoId === u.id ? (
                          <Input
                            value={nomeEdit}
                            onChange={(e) => setNomeEdit(e.target.value)}
                            className="h-8 max-w-[200px]"
                          />
                        ) : u.nome}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.usuario}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>
                          {u.role === 'admin' ? 'Administrador' : 'Comum'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_business_partner && <Badge variant="outline">BP</Badge>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(u.criado_em)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          {editandoId === u.id ? (
                            <>
                              <Button size="sm" disabled={salvando === u.id} onClick={() => salvarNome(u.id)}>
                                {salvando === u.id ? '...' : 'Salvar'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditandoId(null)}>
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="outline" onClick={() => iniciarEdicao(u)}>
                                Editar nome
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={salvando === u.id}
                                onClick={() => alternarBp(u)}
                              >
                                {salvando === u.id ? '...' : u.is_business_partner ? 'Remover BP' : 'Marcar BP'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={excluindo === u.id}
                                onClick={() => handleExcluir(u.id, u.usuario)}
                              >
                                {excluindo === u.id ? '...' : 'Excluir'}
                              </Button>
                            </>
                          )}
                        </div>
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
