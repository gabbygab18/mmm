import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "FAQ | Margaret's MemoryCare Music",
  description:
    'Answers to common questions about volunteering, costs, performance length, insurance, and safety at Margaret’s Memorycare Music.',
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children
}
