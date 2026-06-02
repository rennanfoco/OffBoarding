'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Home() {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    function onWheel(e: WheelEvent) {
      if (e.deltaY > 0) setCollapsed(true)
      if (e.deltaY < 0) setCollapsed(false)
    }

    let touchStartY = 0
    function onTouchStart(e: TouchEvent) {
      touchStartY = e.touches[0].clientY
    }
    function onTouchEnd(e: TouchEvent) {
      const dy = touchStartY - e.changedTouches[0].clientY
      if (dy >  20) setCollapsed(true)
      if (dy < -20) setCollapsed(false)
    }

    window.addEventListener('wheel',      onWheel,      { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd,   { passive: true })
    return () => {
      window.removeEventListener('wheel',      onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [])

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white">

      {/* Área do logo */}
      <div
        className="relative flex-shrink-0 overflow-hidden cursor-pointer select-none"
        style={{ height: collapsed ? '56px' : 'clamp(180px, 30vh, 260px)', transition: 'height 0.5s ease-in-out' }}
        onClick={() => setCollapsed(c => !c)}
      >
        {/* Logo grande — centralizado, some voando para a esquerda */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity:       collapsed ? 0 : 1,
            transform:     collapsed ? 'scale(0.6) translateX(-35%)' : 'scale(1) translateX(0)',
            transition:    'opacity 0.35s ease-in-out, transform 0.5s ease-in-out',
            pointerEvents: collapsed ? 'none' : 'auto',
          }}
        >
          <Image
            src="/Logotipo_Área_de_Proteção_Foco_Aluguel_de_Carros_2022-02.png"
            alt="Foco Aluguel de Carros"
            width={280}
            height={94}
            priority
            style={{ width: 'auto', height: 'auto', maxWidth: '280px' }}
          />
        </div>

        {/* Logo pequeno — surge no canto esquerdo ao recolher */}
        <div
          className="absolute top-1/2 left-6"
          style={{
            opacity:         collapsed ? 1 : 0,
            transform:       collapsed ? 'translateY(-50%) scale(1)' : 'translateY(-50%) scale(0.5) translateX(-24px)',
            transformOrigin: 'left center',
            transition:      'opacity 0.35s ease-in-out, transform 0.45s ease-in-out',
            pointerEvents:   collapsed ? 'auto' : 'none',
          }}
        >
          <Image
            src="/Logotipo_Área_de_Proteção_Foco_Aluguel_de_Carros_2022-02.png"
            alt="Foco Aluguel de Carros"
            width={280}
            height={94}
            priority
            style={{ width: 'auto', height: '32px' }}
          />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 px-4 border-t border-border bg-muted/40">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-bold">Entrevista de Desligamento</h1>
            <p className="text-muted-foreground text-sm">
              Registre ou consulte entrevistas de desligamento.
            </p>
          </div>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">Registrar Entrevista</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Preencha o formulário com as informações e respostas da entrevista de desligamento.
              </p>
              <Link
                href="/entrevista"
                className={cn(buttonVariants({ variant: 'default' }), 'w-full justify-center')}
              >
                Iniciar formulário
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-base">Consultar Entrevistas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Busque entrevistas já registradas pelo CPF do ex-colaborador e baixe o PDF.
              </p>
              <Link
                href="/consulta"
                className={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-center')}
              >
                Consultar
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  )
}
