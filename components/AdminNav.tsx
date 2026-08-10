'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type Props = {
  role: 'admin' | 'comum' | null
}

const COMMON_LINKS = [
  { href: '/consulta', label: 'Entrevistas' },
]

const ADMIN_LINKS = [
  { href: '/admin/usuarios', label: 'Usuários' },
]

const ACCOUNT_LINK = { href: '/conta', label: 'Minha Conta' }

export function AdminNav({ role }: Props) {
  const pathname = usePathname()
  const router    = useRouter()

  const links = [
    ...COMMON_LINKS,
    ...(role === 'admin' ? ADMIN_LINKS : []),
    ACCOUNT_LINK,
  ]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <nav className="flex items-center gap-1">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <Button variant={pathname === link.href ? 'secondary' : 'ghost'} size="sm">
              {link.label}
            </Button>
          </Link>
        ))}
      </nav>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Sair
      </Button>
    </div>
  )
}
