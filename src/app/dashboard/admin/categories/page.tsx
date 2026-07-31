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
      <h1 className="text-2xl font-bold text-stone-900">Categories</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        The lists musicians and facilities pick from when they register. A category with nothing stored falls back to
        the built-in list, so the forms are never empty.
      </p>

      <div className="mt-8">
        <CategoriesManager kinds={OPTION_KINDS.map((k) => ({ kind: k.kind, label: k.label }))} rows={rows} />
      </div>
    </div>
  )
}
