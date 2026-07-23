import { ReactNode } from 'react'

/**
 * Marketing page hero — composed from layers.
 *
 * The design pack ships each hero as a flattened composite at ~1.8:1, but the
 * mockup band is ~2.46:1 with the photo filling ~90% of its height (it fills
 * ~67% of the composite). No crop of a single flat image satisfies both, so the
 * band is assembled here from background, music-staff artwork, photo cutout and
 * the light-streak wave.
 *
 * Note on the wave: the visible curve in `streak.png` sits between 59% and 77%
 * of the file's height — everything above that is transparent. It therefore has
 * to be placed at its natural aspect and offset, never squashed into a short
 * box, or only the empty top edge shows.
 *
 * The band gets shorter (wider ratio) as the viewport grows, so copy keeps room
 * to breathe on phones and tablets instead of colliding with the photo.
 */
export function PageHero({
  photo,
  photoAlt = '',
  photoWidth = '44%',
  photoWidthSm,
  notes,
  children,
  /** Aspect utility classes, width / height. Mockup desktop sits near 2.46. */
  ratioClass = 'aspect-[1.5] sm:aspect-[1.9] lg:aspect-[2.46]',
  minHeight = 'min-h-[300px]',
  background = 'linear-gradient(100deg, #82aeda 0%, #a1c0e2 32%, #adc2dc 60%, #9dbcdd 100%)',
  copyWidth = 'max-w-[520px]',
  align = 'left',
  /** Colour of the section below, so the wave blends into it. */
  tailColor = 'transparent',
  /** Vertical offset of the wave, as a % of its own height. */
  waveOffset = '17%',
}: {
  photo?: string
  photoAlt?: string
  photoWidth?: string
  photoWidthSm?: string
  notes?: string
  children: ReactNode
  ratioClass?: string
  minHeight?: string
  background?: string
  copyWidth?: string
  align?: 'left' | 'center'
  tailColor?: string
  waveOffset?: string
}) {
  const centered = align === 'center'

  return (
    <section className="relative" style={{ backgroundColor: tailColor }}>
      <div className={`relative w-full overflow-hidden ${ratioClass} ${minHeight}`} style={{ background }}>
        {notes && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={notes}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[16%] left-0 hidden w-[52%] max-w-none select-none opacity-70 sm:block"
          />
        )}

        {photo && (
          <>
            {/* Narrow screens get a slimmer photo so the headline stays clear. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo}
              alt={photoAlt}
              className="absolute right-0 top-0 h-full object-cover object-left-top sm:hidden"
              style={{ width: photoWidthSm ?? photoWidth }}
            />
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

        {/* Light-streak wave. Natural aspect, offset so the curve lands on the
            band's lower edge and bleeds into the section below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mmm/streak.png"
          alt=""
          aria-hidden="true"
          className="landing-wave-glow pointer-events-none absolute inset-x-0 bottom-0 w-full max-w-none select-none"
          style={{ transform: `translateY(${waveOffset})` }}
        />

        <div className="relative mx-auto flex h-full max-w-[1200px] items-center px-5 sm:px-8">
          <div className={`${copyWidth} ${centered ? 'mx-auto text-center' : ''}`}>{children}</div>
        </div>
      </div>
    </section>
  )
}
