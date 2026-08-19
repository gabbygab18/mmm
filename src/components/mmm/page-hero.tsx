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
 * The light streak along the lower edge is the design pack's own artwork —
 * see the comment at the element itself.
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
  /** The design pack's composed hero export — used whole when given. */
  heroImage,
  /** How much of that export's height the copy is centred within. */
  copyBand = '58%',
  /** Band shape, clipping the export just below its wave. */
  heroAspect = '1100 / 560',
  /** Phone-shaped export of the same hero, used below `sm`. The desktop bands
      are wide and put the copy across the photograph on a narrow screen. */
  mobileHeroImage,
  mobileHeroAspect,
  mobileCopyBand,
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
  heroImage?: string
  copyBand?: string
  heroAspect?: string
  mobileHeroImage?: string
  mobileHeroAspect?: string
  mobileCopyBand?: string
}) {
  const centered = align === 'center'

  // The design pack also ships each hero as one composed, transparent export —
  // photo, staff artwork and the light streak already in place, with the wave's
  // dark side left transparent so the section colour shows through. When one is
  // given it is used whole: no layering here can match a hand-composed sweep.
  if (heroImage) {
    return (
      <section className="relative isolate z-20" style={{ backgroundColor: tailColor }}>
        {/* The export runs on past the wave into a tall block of flat navy — the
            page's own sections cover that area, so the band is clipped just
            below the sweep. Without the clip the hero was ~1500px tall and left
            an enormous gap before the content. */}
        {/* Band shape and copy band are carried as custom properties so both
            can change at `sm` — an inline aspectRatio cannot hold a breakpoint,
            and the phone export is a different shape from the wide one. */}
        <div
          className="relative w-full overflow-hidden aspect-[var(--hero-ar-m)] sm:aspect-[var(--hero-ar)]"
          style={
            {
              '--hero-ar-m': mobileHeroAspect ?? heroAspect,
              '--hero-ar': heroAspect,
              '--copy-band-m': mobileCopyBand ?? copyBand,
              '--copy-band': copyBand,
            } as React.CSSProperties
          }
        >
          <picture>
            {mobileHeroImage && <source srcSet={mobileHeroImage} media="(max-width: 639px)" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImage}
              alt=""
              aria-hidden="true"
              className="absolute inset-x-0 top-0 block w-full select-none"
            />
          </picture>
          {/* Scrim: a top-anchored dark gradient over the photo. Chasing an
              aspect-ratio number that dodges whatever's underneath the text
              in the source photo (a white swoosh, in this case) is fragile —
              it depends on the exact crop AND how many lines the text wraps
              to, and shrinking the box to dodge one problem spot caused the
              next one: overflow-hidden clipping the paragraph once it needed
              more room than the shrunk box had. A scrim guarantees contrast
              regardless of what's behind it, so the box can stay tall enough
              for wrapped text without clipping. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[var(--copy-band-m)] bg-gradient-to-b from-ocean-950/55 via-ocean-950/25 to-transparent sm:h-[var(--copy-band)]"
          />
          {/* items-center on a short mobile crop still let tall (wrapped)
              text touch the box's top edge — which sits flush against the
              header above it, no gap at all. pt-6 reserves breathing room on
              phones specifically; sm:pt-0 leaves the taller desktop bands,
              where centering already had room, untouched. */}
          <div className="absolute inset-x-0 top-0 flex h-[var(--copy-band-m)] items-center pt-6 sm:h-[var(--copy-band)] sm:pt-0">
            <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
              <div className={`${copyWidth} ${centered ? 'mx-auto text-center' : ''}`}>{children}</div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    // z-20: the streak below hangs past this section, and without a stacking
    // order the next section's background paints straight over it.
    <section className="relative isolate z-20" style={{ backgroundColor: tailColor }}>
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

        <div className="relative z-20 mx-auto flex h-full max-w-[1200px] items-center px-5 sm:px-8">
          <div className={`${copyWidth} ${centered ? 'mx-auto text-center' : ''}`}>{children}</div>
        </div>
      </div>

      {/* Light streak — the design pack's own artwork (streak-band.png, a
          1099x350 export whose glow fills the canvas).
          It sits OUTSIDE the band on purpose: in the mock-ups the wave is the
          transition between the photo band and the section beneath, so it has
          to cross that edge. Inside the band the section's clipping sliced it
          off flat. Its height is set rather than its width — scaling by width
          made the sweep taller than the hero itself. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mmm/streak-band.png"
        alt=""
        aria-hidden="true"
        className={`landing-wave-glow pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[104px] w-full translate-y-[62%] select-none object-fill sm:h-[150px] lg:h-[196px] ${
          mobileImage ? 'hidden sm:block' : ''
        }`}
      />

    </section>
  )
}
