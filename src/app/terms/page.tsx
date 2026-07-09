import Link from 'next/link'
import { SiteFooter } from '@/components/site-footer'

export const metadata = {
  title: "Terms of Service — Margaret's MemoryCare Music",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600">
              <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="text-sm font-bold text-stone-900">Margaret&apos;s MemoryCare Music</span>
          </Link>
          <Link href="/login" className="text-sm font-medium text-stone-500 hover:text-stone-900">
            Sign in
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold text-stone-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: June 28, 2026</p>

        <div className="prose prose-stone mt-8 max-w-none text-stone-700">

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">About this platform</h2>
            <p className="mt-3 leading-relaxed">
              Margaret&apos;s MemoryCare Music (<strong>margaretsmemorycaremusic.com</strong>) is a volunteer scheduling platform that connects musicians with memory care facilities. By creating an account you agree to these Terms of Service. If you do not agree, do not use the platform.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Volunteer-only model</h2>
            <p className="mt-3 leading-relaxed">
              This platform facilitates entirely <strong>unpaid, volunteer performances</strong>. Musicians agree that performances arranged through this platform are provided free of charge to memory care facilities. Memory care facilities agree not to solicit paid engagements through this platform and not to withhold compensation that musicians are otherwise entitled to under separate agreements.
            </p>
            <p className="mt-3 leading-relaxed">
              We do not charge fees to musicians or facilities. We do not collect or process payments. Any financial arrangements made outside of this platform are solely between the parties involved and are not covered by or endorsed by these Terms.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Eligibility and accounts</h2>
            <ul className="mt-3 space-y-1.5 pl-5 leading-relaxed list-disc">
              <li>You must be 18 years of age or older to create an account</li>
              <li>You must provide accurate, current information when registering</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li>You may not create more than one account per person or organization</li>
              <li>Accounts are approved at our discretion and may be suspended or terminated at any time for violation of these Terms</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Acceptable use</h2>
            <p className="mt-3 leading-relaxed">You agree not to:</p>
            <ul className="mt-3 space-y-1.5 pl-5 leading-relaxed list-disc">
              <li>Use the platform for any commercial solicitation or paid engagement outside the volunteer model described above</li>
              <li>Post false, misleading, or impersonated profile information</li>
              <li>Harass, threaten, or harm other users in any way</li>
              <li>Upload or link to content that is unlawful, obscene, defamatory, or infringes on the rights of others</li>
              <li>Attempt to gain unauthorized access to any account, system, or data</li>
              <li>Use automated tools to scrape, crawl, or collect user data without permission</li>
              <li>Use the platform in any way that violates applicable local, state, or federal law</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Scheduling and commitments</h2>
            <p className="mt-3 leading-relaxed">
              When a scheduling request is accepted by both parties, it represents a good-faith commitment to show up as agreed. We understand that life happens — if you need to cancel, please do so as early as possible through the platform so the other party has time to make other arrangements.
            </p>
            <p className="mt-3 leading-relaxed">
              Repeated no-shows or cancellations without notice may result in account suspension. We reserve the right to remove users who repeatedly fail to honor commitments made through the platform.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Content and photos</h2>
            <p className="mt-3 leading-relaxed">
              You retain ownership of content you upload to your profile (including photos and bio text). By uploading content, you grant Margaret&apos;s MemoryCare Music a non-exclusive, royalty-free license to display that content on the platform and in promotional materials related to the platform (such as a social media post highlighting our volunteer community).
            </p>
            <p className="mt-3 leading-relaxed">
              You must have the right to share any content you upload. Do not upload photos of residents, patients, or other individuals without their written consent or the written consent of their legal guardian. Memory care facilities are solely responsible for ensuring appropriate consent is obtained before sharing photos of residents.
            </p>
            <p className="mt-3 leading-relaxed">
              We reserve the right to remove any content that violates these Terms or that we determine, in our sole discretion, is inappropriate for the platform.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Safety and liability</h2>
            <p className="mt-3 leading-relaxed">
              Margaret&apos;s MemoryCare Music is a scheduling platform only. We do not employ musicians, operate memory care facilities, or supervise performances. We do not conduct background checks on musicians or verify facility credentials beyond basic account approval.
            </p>
            <p className="mt-3 leading-relaxed">
              Facilities are responsible for following their own visitor, safety, and infection-control policies. Musicians are responsible for complying with any facility requirements, including health screenings, visitor sign-in, or vaccination requirements.
            </p>
            <p className="mt-3 leading-relaxed">
              To the maximum extent permitted by law, Margaret&apos;s MemoryCare Music is not liable for any injury, loss, or harm arising from in-person interactions arranged through this platform.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Account termination</h2>
            <p className="mt-3 leading-relaxed">
              You may delete your account at any time from your account settings. We may suspend or terminate your account at any time for violation of these Terms, repeated failure to honor commitments, or behavior that is harmful to other users or to the platform&apos;s mission.
            </p>
            <p className="mt-3 leading-relaxed">
              Upon deletion, your personal profile information will be removed or anonymized per our <Link href="/privacy" className="font-medium text-brand-700 underline">Privacy Policy</Link>. Anonymized records of completed events may be retained.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Disclaimers</h2>
            <p className="mt-3 leading-relaxed">
              The platform is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee uninterrupted availability, the accuracy of user-submitted information, or any particular outcome from connections made through the platform.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Changes to these Terms</h2>
            <p className="mt-3 leading-relaxed">
              We may update these Terms from time to time. We will notify active users by posting updated Terms with a new effective date. Continued use of the platform after the effective date constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Contact</h2>
            <p className="mt-3 leading-relaxed">
              Questions about these Terms:{' '}
              <a href="mailto:privacy@margaretsmemorycaremusic.com" className="font-medium text-brand-700 underline">
                privacy@margaretsmemorycaremusic.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-stone-200 pt-6">
          <Link href="/privacy" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            View Privacy Policy →
          </Link>
        </div>
      </main>

      <div className="mx-auto max-w-3xl px-6">
        <SiteFooter theme="light" />
      </div>
    </div>
  )
}
