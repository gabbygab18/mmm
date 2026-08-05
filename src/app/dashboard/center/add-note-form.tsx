'use client'

import { useState } from 'react'
import { addCenterNoteAction } from './actions'

/** Collapsible inline form for the Facility Notes panel's "+ Add Notes" action. */
export function AddNoteForm() {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-poppins text-[10px] font-bold uppercase tracking-[0.1em] text-ocean-900 transition hover:text-ocean-600"
      >
        + Add Notes
      </button>
    )
  }

  return (
    <form
      action={async (formData) => {
        await addCenterNoteAction(formData)
        setOpen(false)
      }}
      className="w-full max-w-[220px] space-y-2 text-left"
    >
      <input
        name="title"
        required
        placeholder="Title"
        className="w-full rounded-md border border-ocean-300 bg-white px-2.5 py-1.5 font-poppins text-[11px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
      />
      <textarea
        name="body"
        rows={2}
        placeholder="Note (optional)"
        className="w-full resize-none rounded-md border border-ocean-300 bg-white px-2.5 py-1.5 font-poppins text-[11px] text-ocean-900 outline-none ring-ocean-500 focus:ring-1"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-ocean-800 px-3 py-1 font-poppins text-[10px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-ocean-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-ocean-800/40 px-3 py-1 font-poppins text-[10px] font-bold uppercase tracking-[0.08em] text-ocean-900 transition hover:bg-ocean-900/5"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
