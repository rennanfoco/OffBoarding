import Image from 'next/image'
import Link from 'next/link'

export function FocoHeader() {
  return (
    <header className="w-full bg-white border-b border-border py-3 px-6 flex items-center">
      <Link href="/">
        <Image
          src="/Logotipo_Área_de_Proteção_Foco_Aluguel_de_Carros_2022-02.png"
          alt="Foco Aluguel de Carros"
          width={120}
          height={40}
          priority
          style={{ width: 'auto', height: '32px' }}
        />
      </Link>
    </header>
  )
}
