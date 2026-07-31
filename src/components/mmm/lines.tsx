import { Fragment } from 'react'

/**
 * Renders editable copy, turning newlines into line breaks.
 *
 * The marketing headings are written across two lines in the design ("Every
 * Song / Has a Story."), and an admin editing them in a textarea expects Enter
 * to do the same thing. Nothing else in the text is interpreted — it is not
 * markdown and never becomes HTML, so a stray angle bracket in the editor
 * cannot turn into markup on a public page.
 */
export function Lines({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  )
}
