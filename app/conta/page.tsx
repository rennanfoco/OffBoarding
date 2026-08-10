'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FocoHeader } from '@/components/FocoHeader'
import { AdminNav } from '@/components/AdminNav'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ContaPage() {
  const router = useRouter()

  const [role,      setRole]      = useState<'admin' | 'comum' | null>(null)
  const [usuario,   setUsuario]   = useState('')

  const [senhaAtual, setSenhaAtual] = useState('')
  const [senhaNova,  setSenhaNova]  = useState('')
  const [confirmar,  setConfirmar]  = useState('')
  const [salvando,   setSalvando]   = useState(false)
  const [erro,       setErro]       = useState('')
  const [sucesso,    setSucesso]    = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => { setRole(json.role); setUsuario(json.usuario) })
      .catch(() => router.push('/login'))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso(false)

    if (senhaNova !== confirmar) {
      setErro('A confirmação não é igual à nova senha.')
      return
    }

    setSalvando(true)
    try {
      const res = await fetch('/api/auth/me', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ senhaAtual, senhaNova }),
      })
      if (!res.ok) {
        const json = await res.json()
        setErro(json.error ?? 'Erro ao trocar a senha.')
        return
      }
      setSenhaAtual(''); setSenhaNova(''); setConfirmar('')
      setSucesso(true)
    } finally {
      setSalvando(false)
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
            <h1 className="text-2xl font-bold">Minha conta</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Logado como <span className="font-medium text-foreground">{usuario}</span>
            </p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Trocar senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="senhaAtual">Senha atual</Label>
                  <Input
                    id="senhaAtual"
                    type="password"
                    autoComplete="current-password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="senhaNova">Nova senha</Label>
                  <Input
                    id="senhaNova"
                    type="password"
                    autoComplete="new-password"
                    value={senhaNova}
                    onChange={(e) => setSenhaNova(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="confirmar">Confirmar nova senha</Label>
                  <Input
                    id="confirmar"
                    type="password"
                    autoComplete="new-password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                {erro && <p className="text-sm text-destructive">{erro}</p>}
                {sucesso && <p className="text-sm text-green-600">Senha atualizada com sucesso.</p>}

                <Button type="submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar nova senha'}
                </Button>
              </form>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  )
}
