'use client'

import { useState } from 'react'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import { PageHero } from '@/components/mmm/page-hero'
import { Field, TextField, inputClass, labelClass } from '@/components/mmm/form-kit'
import { HumanCheck, type HumanCheckValue } from '@/components/mmm/human-check'

/**
 * Contact — inquiry form with a volunteer / facility toggle, direct contact
 * cards, social links, and the service-area map.
 *
 * The form posts to /api/contact. Until the mail transport is wired up that
 * route stores the message and returns success, so the page never silently
 * drops an inquiry.
 */

const SOCIALS = [
  { label: 'Facebook', icon: '/mmm/pages/social-fb.png', href: 'https://www.facebook.com/' },
  { label: 'Instagram', icon: '/mmm/pages/social-ig.png', href: 'https://www.instagram.com/' },
  { label: 'YouTube', icon: '/mmm/pages/social-yt.png', href: 'https://www.youtube.com/' },
  { label: 'TikTok', icon: '/mmm/pages/social-tiktok.png', href: 'https://www.tiktok.com/' },
]

type Status = 'idle' | 'sending' | 'sent' | 'error'

export default function ContactPage() {
  const [inquiryType, setInquiryType] = useState<'volunteer' | 'facility'>('volunteer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [human, setHuman] = useState<HumanCheckValue>({ verified: false, token: null })
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    setError(null)
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in your name, e-mail address, and message.')
      return
    }
    if (!human.verified) {
      setError('Please complete the human verification check.')
      return
    }

    setStatus('sending')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiry_type: inquiryType,
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
          verification_token: human.token,
        }),
      })
      if (!res.ok) throw new Error('Request failed')
      setStatus('sent')
      setFullName('')
      setEmail('')
      setPhone('')
      setMessage('')
    } catch {
      setStatus('error')
      setError('We couldn’t send that message. Please try again, or e-mail us directly.')
    }
  }

  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero ============ */}
      <PageHero
        ratioClass="aspect-[1.9] sm:aspect-[2.6] lg:aspect-[3.2]"
        waveOffset="26%"
        background="linear-gradient(180deg, #dcebfb 0%, #b6d1ec 60%, #a8c8e8 100%)"
        copyWidth="max-w-[900px]"
        align="center"
        tailColor="#b6d1ec"
      >
        <h1 className="landing-rise font-garamond text-[26px] font-bold leading-tight text-white [text-shadow:0_2px_10px_rgba(10,47,90,0.55)] sm:text-[40px] lg:text-[56px] xl:text-[65.9px]">
          We&apos;d Love to Hear from You!
        </h1>
        <p className="landing-rise landing-delay-1 mx-auto mt-3 max-w-[720px] font-poppins text-[12.5px] leading-relaxed text-ocean-900 sm:text-[15px] lg:text-[17.3px]">
          Whether you&apos;re a musician who wants to volunteer or a facility looking to bring live music to your
          residents, we&apos;re here to help.
        </p>
      </PageHero>

      {/* ============ Form + contact details ============ */}
      <section
        className="relative -mt-6 sm:-mt-10 lg:-mt-16"
        style={{ background: 'linear-gradient(180deg, #a8c8e8 0%, #7fa8d8 40%, #0a2f5a 100%)' }}
      >
        <div className="mx-auto grid max-w-[1200px] items-start gap-10 px-5 pb-14 pt-8 sm:px-8 sm:pb-16 lg:grid-cols-2 lg:gap-14 lg:pt-10">
          {/* ---- Send us a message ---- */}
          <div className="rounded-2xl border-2 border-ocean-900 bg-[#faf4e7] px-4 py-7 shadow-2xl sm:rounded-3xl sm:px-8 sm:py-9 lg:px-10">
            <h2 className="text-center font-garamond text-[26px] font-bold text-ocean-900 sm:text-[25.8px]">
              Send Us a Message
            </h2>
            <p className="mt-1 text-center font-poppins text-[12.1px] text-ocean-900">
              Please fill out the form and select the type of inquiry.
            </p>

            <fieldset className="mt-7">
              <legend className={labelClass}>Inquiry Type</legend>
              <div className="mt-1 grid gap-4 sm:grid-cols-2">
                {(
                  [
                    { key: 'volunteer', label: 'Volunteer Inquiry' },
                    { key: 'facility', label: 'Facility Inquiry' },
                  ] as const
                ).map((opt) => {
                  const active = inquiryType === opt.key
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setInquiryType(opt.key)}
                      aria-pressed={active}
                      className={`rounded-lg border-2 px-4 py-3 font-poppins text-[12.1px] font-bold text-ocean-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 ${
                        active
                          ? 'border-ocean-800 shadow-inner'
                          : 'border-ocean-300 bg-white hover:border-ocean-500'
                      }`}
                      style={active ? { background: 'linear-gradient(180deg, #b3d0ee 0%, #7fa8d8 100%)' } : undefined}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="mt-6 space-y-5">
              <TextField label="Full Name" value={fullName} onChange={setFullName} autoComplete="name" />
              <TextField label="E-mail Address" type="email" value={email} onChange={setEmail} autoComplete="email" inputMode="email" />
              <TextField label="Phone Number" value={phone} onChange={setPhone} autoComplete="tel" inputMode="tel" />
              <Field label="Message" htmlFor="contact-message">
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={7}
                  className={`${inputClass} resize-y`}
                />
              </Field>
              <HumanCheck onChange={setHuman} />
            </div>

            {error && <p className="mt-4 text-center font-poppins text-[11px] font-medium text-red-600">{error}</p>}
            {status === 'sent' && (
              <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-center font-poppins text-[11.5px] font-medium text-emerald-800">
                Message sent. We&apos;ll be in touch within two business days.
              </p>
            )}

            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={submit}
                disabled={status === 'sending'}
                className="rounded-lg px-10 py-3 font-poppins text-[12.9px] font-bold uppercase tracking-[0.16em] text-white shadow-[inset_0_-3px_6px_rgba(0,0,0,0.3),0_3px_8px_rgba(7,37,68,0.3)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-400 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: 'linear-gradient(180deg, #4f7aa8 0%, #1e4a7c 45%, #0f3b6b 100%)' }}
              >
                {status === 'sending' ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </div>

          {/* ---- Get in touch ---- */}
          <div className="lg:pt-6">
            <h2 className="text-center font-garamond text-[26px] font-bold text-white sm:text-[34px] lg:text-[45px]">Get in Touch!</h2>
            <p className="mx-auto mt-2 max-w-[420px] text-center font-poppins text-[13.5px] leading-snug text-white sm:text-[17px] lg:text-[21.1px]">
              We&apos;d love to connect and answer any questions you may have.
            </p>

            <div className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ContactCard
                icon="/mmm/pages/contact-email.png"
                title="E-mail Us"
                lines={['info@margaretsmemorycaremusic.org']}
                href="mailto:info@margaretsmemorycaremusic.org"
              />
              <ContactCard
                icon="/mmm/pages/contact-call.png"
                title="Call us"
                lines={['(561) 555-0142', 'Mon – Fri | 9:00 AM – 5:00 PM']}
                href="tel:+15615550142"
              />
              </div>

              <div className="rounded-2xl border border-ocean-300/50 bg-ocean-900 px-7 py-7 shadow-xl">
                <h3 className="font-garamond text-[24px] font-bold text-white sm:text-[25.8px]">Follow us</h3>
                <p className="mt-1 font-poppins text-[15px] leading-snug text-white/90 sm:text-[21.1px]">
                  Stay connected and see how music is making a difference.
                </p>
                <div className="mt-5 flex items-center gap-5">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.label}
                      className="transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.icon} alt="" className="h-12 w-12 object-contain" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ Our location ============ */}
      <section className="bg-ocean-900 pb-16">
        <div className="mx-auto max-w-[1200px] px-6 sm:px-8">
          <div
            className="grid overflow-hidden rounded-2xl shadow-2xl lg:grid-cols-2"
            style={{ background: 'linear-gradient(120deg, #faf4e7 0%, #e9eff6 60%, #d5e2ef 100%)' }}
          >
            <div className="px-6 py-8 sm:px-10 sm:py-10 lg:px-12">
              <h2 className="font-garamond text-[24px] font-bold text-ocean-900 sm:text-[34px] lg:text-[45px]">Our Location</h2>
              <p className="mt-3 max-w-[420px] font-poppins text-[13.5px] leading-relaxed text-ocean-900 sm:text-[14.9px]">
                Proudly serving memory care communities throughout Palm Beach County, Florida
              </p>

              <div className="mt-7 flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/mmm/pages/contact-pin.png" alt="" className="mt-0.5 h-11 w-auto shrink-0 object-contain" />
                <div>
                  <p className="font-poppins text-[14px] font-bold text-ocean-900 sm:text-[14.9px]">
                    Margaret&apos;s Memorycare Music
                  </p>
                  <p className="font-poppins text-[13.5px] text-ocean-900 sm:text-[14.9px]">Palm Beach County, FL</p>
                </div>
              </div>

              <p className="mt-5 max-w-[380px] font-poppins text-[13.5px] leading-relaxed text-ocean-900 sm:text-[14.9px]">
                Bringing live music and meaningful moments to your community.
              </p>
            </div>

            <div className="relative min-h-[200px] sm:min-h-[280px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mmm/pages/contact-map.png"
                alt="Map of the Palm Beach County service area"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}

function ContactCard({
  icon,
  title,
  lines,
  href,
}: {
  icon: string
  title: string
  lines: string[]
  href: string
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-2xl px-4 py-5 shadow-xl sm:gap-5 sm:px-7 sm:py-6 transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{ background: 'linear-gradient(120deg, #faf4e7 0%, #e9eff6 60%, #d5e2ef 100%)' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon} alt="" className="h-10 w-10 shrink-0 object-contain sm:h-14 sm:w-14" />
      <div>
        <h3 className="font-garamond text-[17px] font-bold text-ocean-900 sm:text-[25.8px]">{title}</h3>
        {lines.map((line) => (
          <p key={line} className="break-words font-poppins text-[10px] leading-snug text-ocean-900 sm:text-[14px] lg:text-[16px]">
            {line}
          </p>
        ))}
      </div>
    </a>
  )
}
