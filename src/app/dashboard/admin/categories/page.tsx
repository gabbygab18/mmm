import { redirect } from 'next/navigation'
import { getCurrentUserRole } from '@/lib/auth'
import { getAllSiteOptions, OPTION_KINDS } from '@/lib/mmm/site-options'
import { CategoriesManager } from './categories-manager'

export const metadata = { title: "Categories | Margaret's MemoryCare Music" }

/** Admin → categories. The vocabularies the registration forms offer. */
export default async function AdminCategoriesPage() {
  const role = await getCurrentUserRole()
  if (role !== 'admin') redirect('/dashboard')

  const rows = await getAllSiteOptions()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="font-garamond text-[28px] font-bold text-ocean-900">Categories</h1>
      <p className="mt-1 max-w-2xl font-poppins text-[12.5px] text-ocean-900/70">
        The lists musicians and facilities pick from when they register. A category with nothing stored falls back to
        the built-in list, so the forms are never empty.
      </p>

      <div className="mt-8">
        <CategoriesManager kinds={OPTION_KINDS.map((k) => ({ kind: k.kind, label: k.label }))} rows={rows} />
      </div>
    </div>
  )
}
