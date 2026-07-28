import type { Metadata } from 'next'
import { MarketingHeader } from '@/components/mmm/marketing-header'
import { MarketingFooter } from '@/components/mmm/marketing-footer'
import {
  EDU_BODY_BG,
  EduCard,
  EduDetailHero,
  EduH2,
  EduBodyTitle,
  EduNavyBand,
  EduFaqList,
  EduOrgTable,
  EduRefLinks,
  EduSourceBar,
  EduSubtitle,
} from '@/components/mmm/education-detail-ui'

export const metadata: Metadata = {
  title: "Family Resources | Margaret's MemoryCare Music",
  description:
    'Helping families understand memory loss and discover how music can create meaningful moments of connection.',
}

const CARING_TIPS_L = ['Speak calmly and slowly', 'Use short, simple sentences', 'Maintain eye contact']
const CARING_TIPS_R = ['Smile often', 'Focus on reassurance instead of correction', 'Celebrate small moments together']

const SYMPTOMS_L = ['Memory loss', 'Difficulty communicating', 'Confusion', 'Changes in mood or behaviour']
const SYMPTOMS_R = ['Difficulty solving problems', 'Wandering', 'Trouble recognizing familiar people']

const STAGES = [
  { img: '/mmm/pages/edu/family/stage-early.png', title: 'Early Stage', items: ['Mild memory loss', 'Independent living', 'Difficulty finding words'] },
  { img: '/mmm/pages/edu/family/stage-middle.png', title: 'Middle Stage', items: ['Increased confusion', 'Assistance with daily activities', 'Behavioural changes'] },
  { img: '/mmm/pages/edu/family/stage-late.png', title: 'Late Stage', items: ['Significant memory loss', 'Limited communication', 'Full-time care required'] },
]

const MAY_HELP = [
  '/mmm/pages/edu/family/help-anxiety.png',
  '/mmm/pages/edu/family/help-mood.png',
  '/mmm/pages/edu/family/help-conversation.png',
  '/mmm/pages/edu/family/help-memories.png',
  '/mmm/pages/edu/family/help-movement.png',
  '/mmm/pages/edu/family/help-bonds.png',
]
const MAY_HELP_ALT = [
  'Reduce anxiety',
  'Improve mood',
  'Encourage conversation',
  'Trigger long-term memories',
  'Promote movement',
  'Strengthen emotional bonds between families',
]

const CONNECT = [
  '/mmm/pages/edu/family/connect-speak.png',
  '/mmm/pages/edu/family/connect-correct.png',
  '/mmm/pages/edu/family/connect-participate.png',
  '/mmm/pages/edu/family/connect-familiar.png',
  '/mmm/pages/edu/family/connect-routine.png',
  '/mmm/pages/edu/family/connect-feelings.png',
]
const CONNECT_ALT = [
  'Speak Slowly — give extra time for responses',
  "Don't Correct Memories — gently redirect the conversation",
  'Encourage Participation — invite singing, clapping, or humming',
  'Use Familiar Music — songs from adolescence and early adulthood trigger the strongest memories',
  'Keep a Routine — predictability reduces anxiety',
  'Focus on Feelings — respond to emotions rather than factual accuracy',
]

const ACTIVITIES = [
  { img: '/mmm/pages/edu/family/act-singing.png', label: 'Singing favourite songs' },
  { img: '/mmm/pages/edu/family/act-albums.png', label: 'Looking through photo albums' },
  { img: '/mmm/pages/edu/family/act-dancing.png', label: 'Dancing together' },
  { img: '/mmm/pages/edu/family/act-painting.png', label: 'Painting or colouring' },
  { img: '/mmm/pages/edu/family/act-gardening.png', label: 'Gardening' },
  { img: '/mmm/pages/edu/family/act-walks.png', label: 'Taking short walks' },
  { img: '/mmm/pages/edu/family/act-poems.png', label: 'Reading poems aloud' },
  { img: '/mmm/pages/edu/family/act-performances.png', label: 'Watching live music performances' },
  { img: '/mmm/pages/edu/family/act-puzzles.png', label: 'Simple puzzles' },
  { img: '/mmm/pages/edu/family/act-stories.png', label: 'Sharing family stories' },
]

const FAQ = [
  { q: 'Is music therapy the same as listening to music?', a: 'No. Music therapy is provided by trained professionals, while listening to favourite music is an enjoyable activity anyone can share.' },
  { q: 'What songs should I play?', a: "Music from the person's teens and early adulthood is often the most meaningful." },
  { q: 'Can family members attend performances?', a: 'Yes. Family participation often enhances the experience.' },
  { q: 'What if my loved one becomes emotional?', a: 'This is normal. Music can evoke powerful memories and feelings.' },
  { q: 'Can music improve memory?', a: 'Music does not cure dementia, but it can temporarily improve mood, engagement, and memory recall.' },
]

const ORGS = [
  { name: "Alzheimer's Association", href: 'https://www.alz.org', find: 'Caregiver support, education, local services' },
  { name: 'National Institute on Aging', href: 'https://www.nia.nih.gov', find: 'Dementia information and caregiving guides' },
  { name: 'World Health Organization', href: 'https://www.who.int', find: 'Global dementia information' },
  { name: "Alzheimer's Society (UK)", href: 'https://www.alzheimers.org.uk', find: 'Practical caregiving advice and resources' },
  { name: 'Music & Memory', href: 'https://musicandmemory.org', find: 'Music-based dementia programmes' },
]

function TwoColBullets({ left, right, bold = false }: { left: string[]; right: string[]; bold?: boolean }) {
  const cls = `font-poppins text-[14px] leading-snug text-ocean-900 sm:text-[16px] ${bold ? 'font-medium' : ''}`
  return (
    <div className="mt-4 grid gap-x-10 gap-y-2 sm:grid-cols-2">
      <ul className="list-disc space-y-2 pl-6">
        {left.map((i) => (
          <li key={i} className={cls}>{i}</li>
        ))}
      </ul>
      <ul className="list-disc space-y-2 pl-6">
        {right.map((i) => (
          <li key={i} className={cls}>{i}</li>
        ))}
      </ul>
    </div>
  )
}

export default function FamilyResourcesPage() {
  return (
    <main className="font-sans">
      <MarketingHeader />

      <EduDetailHero
        photo="/mmm/pages/edu/family/hero.png"
        photoAlt="A multigenerational family standing arm in arm looking out at the sea"
        title="Family Resources"
      />

      {/* ============ Body ============ */}
      <div style={{ background: EDU_BODY_BG }}>
        <div className="mx-auto max-w-[1150px] px-5 py-12 sm:px-8 sm:py-16">
          <EduSubtitle>
            Helping families understand memory loss and discover how music can create meaningful moments of connection.
          </EduSubtitle>

          {/* Caring for Someone with Memory Loss */}
          <EduCard className="mt-10">
            <EduH2>Caring for Someone with Memory Loss</EduH2>
            <p className="mt-3 max-w-[900px] font-poppins text-[14px] leading-relaxed text-ocean-900/90 sm:text-[16.5px]">
              Caring for a loved one with dementia can be both rewarding and challenging. As memory and communication
              change over time, emotional connection remains possible. Patience, understanding, and meaningful
              activities, such as listening to familiar music, can improve quality of life for both the individual and
              their caregiver.
            </p>
            <p className="mt-5 font-poppins text-[15px] font-bold text-ocean-800 sm:text-[16.5px]">Helpful Tips:</p>
            <TwoColBullets left={CARING_TIPS_L} right={CARING_TIPS_R} />
            <EduRefLinks links={['https://www.nia.nih.gov/health/caregiving', 'https://www.alz.org/help-support/caregiving']} />
          </EduCard>

          {/* Understanding Dementia + Stages */}
          <EduCard className="mt-8">
            <EduH2>Understanding Dementia</EduH2>
            <p className="mt-3 max-w-[980px] font-poppins text-[14px] leading-relaxed text-ocean-900/90 sm:text-[16.5px]">
              Dementia is a general term describing a decline in memory, thinking, and reasoning skills that interferes
              with daily life. Alzheimer&rsquo;s disease is the most common cause, but there are several different types
              of dementia.
            </p>
            <p className="mt-5 font-poppins text-[15px] font-bold text-ocean-800 sm:text-[16.5px]">Common Symptoms:</p>
            <TwoColBullets left={SYMPTOMS_L} right={SYMPTOMS_R} />

            <h3 className="mt-8 font-garamond text-[24px] font-bold text-ocean-800 sm:text-[30px]">Stages of Dementia</h3>
            <div className="mt-5 grid gap-6 sm:grid-cols-3">
              {STAGES.map((s) => (
                <div key={s.title}>
                  <div className="overflow-hidden rounded-xl shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.img} alt={`${s.title} of dementia`} className="aspect-[3/2] w-full object-cover" />
                  </div>
                  <h4 className="mt-3 font-poppins text-[16px] font-bold text-ocean-800 sm:text-[18px]">{s.title}</h4>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5">
                    {s.items.map((i) => (
                      <li key={i} className="font-poppins text-[13.5px] leading-snug text-ocean-900 sm:text-[15px]">{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <EduRefLinks
              links={[
                'https://www.who.int/news-room/fact-sheets/detail/dementia',
                'https://www.alz.org/alzheimers-dementia/what-is-dementia',
                'https://www.nia.nih.gov/health/alzheimers-and-dementia',
              ]}
            />
          </EduCard>

          {/* Music Creates Connection */}
          <EduCard className="mt-8">
            <EduH2>Music Creates Connection</EduH2>
            <p className="mt-3 max-w-[980px] font-poppins text-[14px] leading-relaxed text-ocean-900/90 sm:text-[16.5px]">
              Research has shown that familiar music activates several regions of the brain associated with memory,
              emotion, and movement. Even when verbal communication becomes difficult, music often remains meaningful.
            </p>
            <h3 className="mt-7 font-garamond text-[24px] font-bold text-ocean-800 sm:text-[30px]">Music May Help</h3>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
              {MAY_HELP.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={MAY_HELP_ALT[i]} className="mx-auto h-auto w-full max-w-[150px] object-contain" />
              ))}
            </div>
            <EduRefLinks
              links={[
                'https://www.nia.nih.gov',
                'https://musicandmemory.org',
                'https://www.alzheimers.org.uk/get-support/daily-living/music-and-dementia',
              ]}
            />
          </EduCard>

          {/* Better Ways to Connect (navy band) */}
          <EduNavyBand className="mt-8" withStaff>
            <EduBodyTitle>Better Ways to Connect</EduBodyTitle>
            <div className="mt-8 grid grid-cols-2 items-start gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-6">
              {CONNECT.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt={CONNECT_ALT[i]} className="mx-auto h-auto w-full max-w-[170px] object-contain" />
              ))}
            </div>
            <EduRefLinks
              className="[&_a]:text-ocean-100 [&_a]:decoration-white/40 hover:[&_a]:text-white"
              links={[
                'https://www.alz.org/help-support/caregiving/daily-care/communications',
                'https://www.alz.org/professionals/professional-providers/dementia_care_practice_recommendations',
              ]}
            />
          </EduNavyBand>

          {/* Meaningful Activities */}
          <div className="mt-14">
            <EduBodyTitle>Meaningful Activities</EduBodyTitle>
            <p className="mt-2 font-poppins text-[15px] text-white/95 sm:text-[20.9px]">
              Families don&rsquo;t need elaborate plans to create joyful moments.
            </p>
            <p className="mt-4 font-poppins text-[16px] font-bold text-white sm:text-[18px]">Try these:</p>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {ACTIVITIES.map((a) => (
                <div key={a.label} className="relative overflow-hidden rounded-xl shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt={a.label} className="aspect-[5/3] w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ocean-950/85 to-transparent px-2.5 pb-2 pt-6">
                    <span className="font-poppins text-[11.5px] font-bold leading-tight text-white sm:text-[12.5px]">{a.label}</span>
                  </div>
                </div>
              ))}
            </div>
            <EduRefLinks
              className="[&_a]:text-ocean-100 [&_a]:decoration-white/40 hover:[&_a]:text-white"
              links={['https://www.nia.nih.gov/health/alzheimers-and-dementia', 'https://www.alzheimers.org.uk']}
            />
          </div>

          {/* FAQ */}
          <div className="mt-14">
            <EduBodyTitle>Frequently Asked Questions</EduBodyTitle>
            <EduFaqList items={FAQ} />
            <EduRefLinks
              className="[&_a]:text-ocean-100 [&_a]:decoration-white/40 hover:[&_a]:text-white"
              links={['https://www.musictherapy.org', 'https://musicandmemory.org']}
            />
          </div>

          {/* Helpful Organizations */}
          <div className="mt-14">
            <EduBodyTitle>Helpful Organizations</EduBodyTitle>
            <EduOrgTable rightHeader="What You'll Find" rows={ORGS} />
          </div>

          <EduSourceBar sources={[]} />
        </div>
      </div>

      <MarketingFooter />
    </main>
  )
}
