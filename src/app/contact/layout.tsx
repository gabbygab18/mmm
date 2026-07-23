import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Contact | Margaret's MemoryCare Music",
  description:
    'Get in touch with Margaret’s Memorycare Music — volunteer and facility inquiries, phone, e-mail, and our Palm Beach County service area.',
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
