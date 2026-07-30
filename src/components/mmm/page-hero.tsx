import { ReactNode } from 'react'

/**
 * Marketing page hero — composed from layers.
 *
 * The design pack ships each hero as a flattened composite at ~1.8:1, but the
 * mockup band is ~2.46:1 with the photo filling ~90% of its height (it fills
 * ~67% of the composite). No crop of a single flat image satisfies both, so the
 * band is assembled here from background, music-staff artwork, photo cutout and
 * the drawn light sweep.
 *
 * The light sweep along the lower edge is drawn as SVG rather than dropped in
 * as the exported PNG — see the comment at the element itself.
 *
 * The band gets shorter (wider ratio) as the viewport grows, so copy keeps room
 * to breathe on phones and tablets instead of colliding with the photo.
 */
export function PageHero({
  photo,
  photoAlt = '',
  photoWidth = '44%',
  photoWidthSm,
  /** Mobile-layout banner. The mobile pack ships these already composed at the
      phone band ratio, so below `sm` it replaces the layered composition. */
  mobileImage,
  notes,
  /** Colour the staff artwork is painted in — a soft blue on the pale heroes. */
  notesColor = 'rgba(63, 105, 160, 0.55)',
  /** Soft blurred lights over the upper part of the band. */
  bokeh = false,
  children,
  /** Aspect utility classes, width / height. Mockup desktop sits near 2.46. */
  ratioClass = 'aspect-[1.5] sm:aspect-[1.9] lg:aspect-[2.46]',
  minHeight = 'min-h-[190px]',
  background = 'linear-gradient(100deg, #82aeda 0%, #a1c0e2 32%, #adc2dc 60%, #9dbcdd 100%)',
  copyWidth = 'max-w-[520px]',
  align = 'left',
  /** Colour of the section below, so the wave blends into it. */
  tailColor = 'transparent',
}: {
  photo?: string
  photoAlt?: string
  photoWidth?: string
  photoWidthSm?: string
  mobileImage?: string
  notes?: string
  notesColor?: string
  bokeh?: boolean
  children: ReactNode
  ratioClass?: string
  minHeight?: string
  background?: string
  copyWidth?: string
  align?: 'left' | 'center'
  tailColor?: string
}) {
  const centered = align === 'center'

  return (
    <section className="relative isolate" style={{ backgroundColor: tailColor }}>
      <div className={`relative w-full overflow-hidden ${ratioClass} ${minHeight}`} style={{ background }}>
        {bokeh && (
          /* Soft out-of-focus lights across the upper band, as drawn in the
             design pack. Radial gradients rather than an image — no asset for
             them was exported, and they need to stay crisp at any width. */
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden sm:block"
            style={{
              // A sized `circle <radius> at <x> <y>` keeps them round at any
              // width; percentage stops alone tile into visible rectangles.
              backgroundImage: [
                'radial-gradient(circle 7vw at 12% 24%, rgba(255,255,255,0.30), rgba(255,255,255,0) 72%)',
                'radial-gradient(circle 4vw at 26% 12%, rgba(255,255,255,0.24), rgba(255,255,255,0) 70%)',
                'radial-gradient(circle 8.5vw at 38% 32%, rgba(255,255,255,0.16), rgba(255,255,255,0) 74%)',
                'radial-gradient(circle 3vw at 47% 9%, rgba(255,255,255,0.26), rgba(255,255,255,0) 68%)',
                'radial-gradient(circle 5vw at 7% 50%, rgba(255,255,255,0.15), rgba(255,255,255,0) 72%)',
              ].join(', '),
            }}
          />
        )}
        {notes && (
          /* The staff artwork ships as near-white line art, which disappears on
             a pale hero — in the design pack it reads as a soft blue. So it is
             painted rather than placed: the PNG masks a brand-blue fill. */
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[6%] left-0 hidden w-[62%] select-none sm:block"
            style={{
              aspectRatio: '1100 / 467',
              backgroundColor: notesColor,
              WebkitMaskImage: `url('${notes}')`,
              maskImage: `url('${notes}')`,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
            }}
          />
        )}

        {/* Mobile: the design pack's phone banner, used whole. */}
        {mobileImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mobileImage}
            alt={photoAlt}
            className="absolute inset-0 h-full w-full object-cover object-top sm:hidden"
          />
        )}

        {photo && (
          <>
            {/* Phones without a dedicated banner get a slimmer cutout so the
                headline stays clear of faces. */}
            {!mobileImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={photoAlt}
                className="absolute right-0 top-0 h-full object-cover object-left-top sm:hidden"
                style={{ width: photoWidthSm ?? photoWidth }}
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt=""
              aria-hidden="true"
              className="absolute right-0 top-0 hidden h-full object-cover object-left-top sm:block"
              style={{ width: photoWidth }}
            />
          </>
        )}

        <div className="relative mx-auto flex h-full max-w-[1200px] items-center px-5 sm:px-8">
          <div className={`${copyWidth} ${centered ? 'mx-auto text-center' : ''}`}>{children}</div>
        </div>
      </div>

      {/* Light sweep along the hero's lower edge.
          Drawn rather than dropped in as a PNG. The exported streak was a
          1099x792 canvas that was mostly empty, so at full width it became a
          ~920px transparent sheet whose glow filter washed out the hero and the
          section beneath it. An SVG has no empty canvas to scale, stays sharp at
          any width, and costs a fraction of the bytes.

          Two passes: a wide blurred sweep for the halo, a thin one for the
          bright core, both fading out at either end. */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[30%] translate-y-1/2 select-none ${
          mobileImage ? 'hidden sm:block' : ''
        }`}
        aria-hidden="true"
      >
        <svg viewBox="0 0 1200 200" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id="mmm-sweep-fade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="16%" stopColor="#eaf4ff" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="84%" stopColor="#eaf4ff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <filter id="mmm-sweep-halo" x="-10%" y="-120%" width="120%" height="340%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
            <filter id="mmm-sweep-core" x="-10%" y="-120%" width="120%" height="340%">
              <feGaussianBlur stdDeviation="2.5" />
            </filter>
          </defs>
          <path
            d="M0 150 C 320 52, 880 52, 1200 118"
            fill="none"
            stroke="url(#mmm-sweep-fade)"
            strokeWidth="78"
            strokeLinecap="round"
            filter="url(#mmm-sweep-halo)"
            opacity="0.8"
          />
          <path
            d="M0 150 C 320 52, 880 52, 1200 118"
            fill="none"
            stroke="url(#mmm-sweep-fade)"
            strokeWidth="16"
            strokeLinecap="round"
            filter="url(#mmm-sweep-core)"
          />
        </svg>
      </div>
    </section>
  )
}
