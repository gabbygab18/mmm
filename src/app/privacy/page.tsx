import Link from 'next/link'
import { SiteFooter } from '@/components/site-footer'

export const metadata = {
  title: "Privacy Policy — Margaret's MemoryCare Music",
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-stone-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: June 28, 2026</p>

        <div className="prose prose-stone mt-8 max-w-none text-stone-700">

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Who we are</h2>
            <p className="mt-3 leading-relaxed">
              Margaret&apos;s MemoryCare Music (<strong>margaretsmemorycaremusic.com</strong>) is a volunteer musician platform that connects musicians with memory care facilities for live performances. We are a US-based service operating on a volunteer-only, no-fee model.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">What information we collect</h2>
            <p className="mt-3 leading-relaxed">When you create an account or use our platform, we may collect:</p>
            <ul className="mt-3 space-y-1.5 pl-5 leading-relaxed list-disc">
              <li><strong>Account information:</strong> email address, password (hashed — never stored in plain text), and role (musician or center coordinator)</li>
              <li><strong>Profile information:</strong> name, phone number, ZIP code, bio, profile photo URL, music types, instruments, band format, availability, and travel preferences (musicians); organization name, phone, location address, resident count, and facility photos (centers)</li>
              <li><strong>Scheduling information:</strong> availability dates and times you post, requests you initiate or receive, and scheduling history</li>
              <li><strong>Communications:</strong> in-app alerts and notification records related to your scheduling activity</li>
              <li><strong>Usage data:</strong> standard server logs (IP address, browser, pages visited) retained by our hosting provider (Vercel) for security and performance purposes</li>
            </ul>
            <p className="mt-3 leading-relaxed">We do not collect payment information, government-issued ID, or any sensitive personal data beyond what is listed above.</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">How we use your information</h2>
            <ul className="mt-3 space-y-1.5 pl-5 leading-relaxed list-disc">
              <li>To operate the platform and connect musicians with memory care facilities</li>
              <li>To send transactional notifications about scheduling requests, confirmations, cancellations, and completed events</li>
              <li>To allow other approved users to view your public profile and contact you through the platform</li>
              <li>To allow our administrators to moderate accounts and resolve disputes</li>
              <li>To improve platform reliability and troubleshoot issues</li>
            </ul>
            <p className="mt-3 leading-relaxed">We do not sell your personal information. We do not use your data for advertising.</p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Who can see your information</h2>
            <ul className="mt-3 space-y-1.5 pl-5 leading-relaxed list-disc">
              <li><strong>Other approved users:</strong> Your public profile (name, bio, music types, instruments, availability, photo) is visible to other approved users on the platform — musicians can see center profiles, and centers can see musician profiles</li>
              <li><strong>Contact details:</strong> Your phone number is only revealed to the other party after a scheduling request is accepted</li>
              <li><strong>Administrators:</strong> Our admin team can view all account and scheduling information for moderation and support purposes</li>
              <li><strong>Third-party services:</strong> We use Supabase (database and authentication) and Vercel (hosting). Both process data on our behalf and are bound by their own privacy policies</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Email notifications</h2>
            <p className="mt-3 leading-relaxed">
              We send transactional email notifications related to your scheduling activity (requests, confirmations, cancellations, and completed events). These are not marketing emails. You can opt out of email notifications in your account settings at any time. Opting out does not affect in-app alerts.
            </p>
            <p className="mt-3 leading-relaxed">
              All notification emails include an unsubscribe link. Clicking it will stop email delivery without requiring you to log in.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Data retention</h2>
            <p className="mt-3 leading-relaxed">
              We retain your personal information for as long as your account is active. When you delete your account, we remove or anonymize your personal profile data (name, phone, photo, bio, ZIP code, availability, and notification history). We retain anonymized records of completed events, moderation flags, and authentication audit trails as required for legal, security, and platform integrity purposes.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Your rights</h2>
            <p className="mt-3 leading-relaxed">You have the right to:</p>
            <ul className="mt-3 space-y-1.5 pl-5 leading-relaxed list-disc">
              <li><strong>Access your data:</strong> request a copy of the personal information we hold about you</li>
              <li><strong>Correct your data:</strong> update your profile information at any time from your account settings</li>
              <li><strong>Delete your account:</strong> remove your profile and personal data from the platform via your account settings (self-service) or by contacting us</li>
              <li><strong>Opt out of emails:</strong> unsubscribe from notification emails via your account settings or the unsubscribe link in any email we send</li>
            </ul>
            <p className="mt-3 leading-relaxed">
              To exercise any of these rights or to submit a data access or export request, contact us at{' '}
              <a href="mailto:privacy@margaretsmemorycaremusic.com" className="font-medium text-brand-700 underline">
                privacy@margaretsmemorycaremusic.com
              </a>.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Cookies and local storage</h2>
            <p className="mt-3 leading-relaxed">
              We use session cookies and local storage strictly to keep you signed in and to maintain your preferences. We do not use tracking cookies or third-party advertising cookies.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Children</h2>
            <p className="mt-3 leading-relaxed">
              This platform is intended for users 18 years of age and older. We do not knowingly collect personal information from anyone under 18. If you believe a minor has created an account, please contact us at the address below.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Changes to this policy</h2>
            <p className="mt-3 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify active users by posting the updated policy with a new effective date. Continued use of the platform after the effective date constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-stone-900">Contact</h2>
            <p className="mt-3 leading-relaxed">
              Questions about this policy or requests related to your personal data:{' '}
              <a href="mailto:privacy@margaretsmemorycaremusic.com" className="font-medium text-brand-700 underline">
                privacy@margaretsmemorycaremusic.com
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 border-t border-stone-200 pt-6">
          <Link href="/terms" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            View Terms of Service →
          </Link>
        </div>
      </main>

      <div className="mx-auto max-w-3xl px-6">
        <SiteFooter theme="light" />
      </div>
    </div>
  )
}
