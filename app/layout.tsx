import React from 'react'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AVG — Gestão de Centro de Custo | Mina do Brumado',
  description: 'Sistema de Gestão de Centro de Custo — Grupo AVG, Mina do Brumado.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}