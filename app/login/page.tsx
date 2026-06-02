'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const destino      = searchParams.get('from') ?? '/consulta'

  const [usuario,  setUsuario]  = useState('')
  const [senha,    setSenha]    = useState('')
  const [erro,     setErro]     = useState('')
  const [entrando, setEntrando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setEntrando(true)
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ usuario, senha }),
      })
      if (!res.ok) {
        const json = await res.json()
        setErro(json.error ?? 'Usuário ou senha incorretos.')
        return
      }
      router.push(destino)
    } finally {
      setEntrando(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/40">

      {/* Header igual às outras páginas */}
      <header className="w-full bg-white border-b border-border py-3 px-6 flex items-center">
        <Image
          src="/Logotipo_Área_de_Proteção_Foco_Aluguel_de_Carros_2022-02.png"
          alt="Foco Aluguel de Carros"
          width={120}
          height={40}
          priority
          style={{ width: 'auto', height: '32px' }}
        />
      </header>

      {/* Conteúdo centralizado com peso para cima */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-24">
        <div className="w-full max-w-sm space-y-6">

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">Área de Consulta</h1>
            <p className="text-sm text-muted-foreground">
              Acesso restrito ao time de Business Partners.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entrar</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="space-y-1">
                  <Label htmlFor="usuario">Usuário</Label>
                  <Input
                    id="usuario"
                    placeholder="Digite seu usuário"
                    autoComplete="username"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>

                {erro && (
                  <p className="text-xs text-destructive text-center">{erro}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={entrando || !usuario || !senha}
                >
                  {entrando ? 'Entrando...' : 'Entrar'}
                </Button>

              </form>
            </CardContent>
          </Card>

        </div>
      </main>

    </div>
  )
}
