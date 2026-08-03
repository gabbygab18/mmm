import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { CONTENT_FIELDS, CONTENT_GROUPS, getSiteContent } from '@/lib/mmm/site-content'
import { ContentEditor } from './content-editor'

export const metadata = { title: "Website content | Margaret's MemoryCare Music" }

/** Admin → website content. Editable copy for the public marketing pages. */
export default async function AdminContentPage() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') redirect('/dashboard')

  const content = await getSiteContent()
  const current = Object.fromEntries(CONTENT_FIELDS.map((f) => [f.key, content(f.key)]))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Website content</h1>
      <p className="mt-1 max-w-2xl font-poppins text-[12.5px] text-ocean-900/70">
        Wording on the public pages. Anything left as it came is not stored — clear a field, or use &ldquo;reset to
        original wording&rdquo;, and the page goes back to what it shipped with.
      </p>

      <div className="mt-8">
        <ContentEditor groups={CONTENT_GROUPS} current={current} />
      </div>
    </div>
  )
}
