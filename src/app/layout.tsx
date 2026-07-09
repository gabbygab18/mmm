import type { Metadata } from 'next'
import { Nunito, Playfair_Display } from 'next/font/google'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700', '800'],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: "Margaret's MemoryCare Music",
  description: 'Connecting volunteer musicians with memory care facilities for live performances.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${nunito.variable} ${playfair.variable}`}>
      <body className="overflow-x-hidden antialiased">{children}</body>
    </html>
  )
}
