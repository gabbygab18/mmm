import Link from 'next/link'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'

/**
 * Get Started — "Ready to Make a Difference?" (approved design).
 * Path cards · Why Join · Already have an account? band.
 */

const REASONS = [
  {
    icon: '/mmm/icon-community.png',
    title: 'Community',
    body: 'Meet musicians and organizations dedicated to making a difference.',
  },
  {
    icon: '/mmm/icon-live-music.png',
    title: 'Live Music',
    body: 'Create joyful moments through personalized performances.',
  },
  {
    icon: '/mmm/icon-impact.png',
    title: 'Meaningful Impact',
    body: 'Bring comfort, connection, and happiness to older adults.',
  },
]

export default function GetStartedPage() {
  return (
    <main className="bg-ocean-900 font-sans">
      <MarketingHeader />

      {/* ============ Hero + path cards ============ */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-top"
          style={{ backgroundImage: "url('/mmm/gs-bg.png')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(127,168,216,0.15) 0%, rgba(10,47,90,0.55) 70%, #0a2f5a 100%)' }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1100px] px-6 pb-4 pt-14 sm:px-8">
          <h1 className="landing-rise text-center font-garamond text-[42px] font-semibold leading-tight text-white drop-shadow-md sm:text-[56px] lg:text-[65.9px]">
            Ready to Make a Difference?
          </h1>
          <p className="landing-rise landing-delay-1 mx-auto mt-4 max-w-[760px] text-center font-poppins text-[14px] leading-relaxed text-white drop-shadow sm:text-[16.1px]">
            Join Margaret&apos;s Memorycare Music by volunteering your musical talents or registering your memory care
            community. Together, we create meaningful moments through live music.
          </p>

          <div className="landing-rise landing-delay-2 mx-auto mt-12 grid max-w-[960px] gap-8 md:grid-cols-2">
            {/* Musician card */}
            <div className="overflow-hidden rounded-2xl bg-[#faf4e7] shadow-2xl">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mmm/gs-musician.png"
                  alt="A volunteer musician playing an acoustic guitar"
                  className="h-64 w-full object-cover object-top opacity-90"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-20"
                  style={{ background: 'linear-gradient(180deg, rgba(250,244,231,0) 0%, #faf4e7 100%)' }}
                  aria-hidden="true"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mmm/icon-note.png"
                  alt=""
                  className="absolute -bottom-8 left-1/2 h-16 w-16 -translate-x-1/2 object-contain"
                />
              </div>
              <div className="flex flex-col items-center px-8 pb-9 pt-11 text-center">
                <h2 className="font-garamond text-[20px] font-bold text-ocean-900">I&apos;m a Musician</h2>
                <p className="mt-1 font-poppins text-[11.4px] leading-relaxed text-ocean-900">
                  Share your gift.
                  <br />
                  Become a volunteer.
                </p>
                <Link
                  href="/register/musician"
                  className="mt-5 rounded-lg border-[1.5px] border-ocean-800 px-6 py-2.5 font-poppins text-[12.2px] font-bold uppercase tracking-[0.12em] text-ocean-900 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
                >
                  Join as Musician
                </Link>
              </div>
            </div>

            {/* Community card */}
            <div className="overflow-hidden rounded-2xl bg-[#faf4e7] shadow-2xl">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mmm/gs-community.png"
                  alt="A caregiver sharing a joyful moment with a memory care resident"
                  className="h-64 w-full object-cover object-top opacity-90"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-20"
                  style={{ background: 'linear-gradient(180deg, rgba(250,244,231,0) 0%, #faf4e7 100%)' }}
                  aria-hidden="true"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mmm/icon-facility.png"
                  alt=""
                  className="absolute -bottom-8 left-1/2 h-16 w-16 -translate-x-1/2 object-contain"
                />
              </div>
              <div className="flex flex-col items-center px-8 pb-9 pt-11 text-center">
                <h2 className="font-garamond text-[20px] font-bold leading-tight text-ocean-900">
                  I&apos;m a Memory Care Community
                </h2>
                <p className="mt-1 font-poppins text-[11.4px] leading-relaxed text-ocean-900">
                  Bring meaningful live performances to your residents
                </p>
                <Link
                  href="/register/facility"
                  className="mt-5 rounded-lg border-[1.5px] border-ocean-800 px-6 py-2.5 font-poppins text-[12.2px] font-bold uppercase tracking-[0.12em] text-ocean-900 transition hover:bg-ocean-900/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
                >
                  Register Your Community
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ============ Why Join ============ */}
        <div className="relative bg-transparent">
          <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-14 sm:px-8">
            <h2 className="text-center font-garamond text-[28px] font-bold text-white sm:text-[34.5px]">
              Why Join Margaret&apos;s Memorycare Music?
            </h2>

            <div className="mt-12 grid gap-10 sm:grid-cols-3">
              {REASONS.map((r) => (
                <div key={r.title} className="flex items-start gap-4 sm:flex-col sm:items-center lg:flex-row lg:items-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.icon} alt="" className="h-24 w-24 shrink-0 object-contain" />
                  <div className="sm:text-center lg:text-left">
                    <h3 className="font-garamond text-[23.5px] font-bold text-white">{r.title}</h3>
                    <p className="mt-1 max-w-[220px] font-poppins text-[11.4px] leading-relaxed text-white/95">{r.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Already have an account */}
            <div
              className="relative mt-14 overflow-hidden rounded-2xl px-8 py-9 shadow-xl sm:px-12"
              style={{ background: 'linear-gradient(100deg, #faf4e7 0%, #e9eef5 60%, #d5e2ef 100%)' }}
            >
              <div
                className="absolute inset-0 opacity-25"
                style={{ backgroundImage: "url('/mmm/notes-bg.png')", backgroundRepeat: 'no-repeat', backgroundSize: '620px auto', backgroundPosition: 'right -60px center' }}
                aria-hidden="true"
              />
              <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-garamond text-[26px] font-bold text-ocean-900 sm:text-[32.7px]">
                    Already have an account?
                  </h2>
                  <p className="mt-1 font-poppins text-[14px] text-ocean-900 sm:text-[16.9px]">
                    Sign in to manage your profile requests and upcoming performances.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="rounded-full bg-ocean-300/90 px-12 py-3 font-poppins text-[17px] font-bold uppercase tracking-[0.2em] text-white shadow-[inset_0_-3px_6px_rgba(7,37,68,0.35),0_3px_8px_rgba(7,37,68,0.25)] transition hover:bg-ocean-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}