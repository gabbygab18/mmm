import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Facility Registration | Margaret's MemoryCare Music",
  description:
    'Register your memory care community to receive free live music performances from volunteer musicians.',
}

export default function FacilityRegistrationLayout({ children }: { children: React.ReactNode }) {
  return children
}
