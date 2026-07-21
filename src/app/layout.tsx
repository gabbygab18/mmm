import type { Metadata } from 'next'
import { Poppins, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

/**
 * Brand fonts (approved design pack):
 *  - Cormorant Garamond → headings  (`font-garamond`, also the `display` family)
 *  - Poppins            → body/UI   (`font-poppins`, also the default `sans` family)
 */
const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

const garamond = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  weight: ['500', '600', '700'],
  variable: '--font-garamond',
})

export const metadata: Metadata = {
  title: "Margaret's MemoryCare Music",
  description: 'Connecting volunteer musicians with memory care facilities for live performances.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${garamond.variable}`}>
      <body className="overflow-x-hidden antialiased">{children}</body>
    </html>
  )
}
