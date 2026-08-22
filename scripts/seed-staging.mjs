/**
 * Seeds the staging database from a production export.
 *
 * Staging exists so preview deployments have something to work against
 * without touching live data. It therefore wants the same shape of data,
 * with the same ids — foreign keys run through every table here, so
 * regenerating ids would produce a database that looks right and joins
 * wrong.
 *
 * Two things are deliberately NOT copied faithfully:
 *
 *  - Passwords. The export cannot contain them (Supabase's admin API does not
 *    return hashes), so every seeded account gets the same known staging
 *    password. That is acceptable here precisely because it is not real data
 *    and not reachable from the live site.
 *  - E-mail addresses are rewritten to a staging-only domain, so a stray send
 *    from a preview build cannot reach a real musician or facility. This is
 *    the important one: a preview environment that can e-mail your actual
 *    members is worse than no preview environment.
 *
 * Usage: node scripts/seed-staging.mjs <backupDir>
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const backupDir = process.argv[2]
if (!backupDir) {
  console.error('Usage: node scripts/seed-staging.mjs <backupDir>')
  process.exit(1)
}

const url = process.env.STAGING_SUPABASE_URL
const key = process.env.STAGING_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Missing STAGING_SUPABASE_URL or STAGING_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const read = (name) => {
  const path = join(backupDir, `${name}.json`)
  if (!existsSync(path)) return []
  return JSON.parse(readFileSync(path, 'utf8'))
}

/** Every seeded login uses this. Staging only — nothing real is behind it. */
const STAGING_PASSWORD = 'StagingOnly!2026'

/**
 * Rewrite an address so it can never reach a real person. Keeps the local
 * part readable so accounts stay recognisable while testing.
 */
function stagingEmail(original, id) {
  const local = (original ?? '').split('@')[0] || `user-${id.slice(0, 8)}`
  return `${local.replace(/[^a-zA-Z0-9._-]/g, '')}@staging.invalid`
}

async function main() {
  const authUsers = read('auth_users')
  console.log(`Seeding ${authUsers.length} accounts…`)

  // The bootstrap trigger on auth.users builds profile rows from metadata as
  // each account is created. It cannot be switched off from here (the CLI
  // role does not own auth.users), so instead the rows it invents are cleared
  // below before the real ones go in — otherwise its generated ids would
  // collide with the exported ones on the user_id uniqueness constraint.
  let created = 0
  for (const u of authUsers) {
    const { error } = await supabase.auth.admin.createUser({
      email: stagingEmail(u.email, u.id),
      password: STAGING_PASSWORD,
      email_confirm: true,
      user_metadata: u.user_metadata ?? {},
      id: u.id,
    })
    if (error) {
      console.log(`  ! ${u.id.slice(0, 8)}: ${error.message}`)
    } else {
      created += 1
    }
  }
  console.log(`  accounts created: ${created}/${authUsers.length}`)

  // Clear whatever the bootstrap trigger produced, so the exported rows can
  // go in with their original ids intact. Safe to do wholesale: staging holds
  // nothing but what this script puts there.
  for (const t of ['center_locations', 'centers', 'musicians']) {
    const { error } = await supabase.from(t).delete().not('id', 'is', null)
    if (error) console.log(`  ! clearing ${t}: ${error.message}`)
  }

  // Parent rows before children — the FK graph runs
  // users -> musicians/centers -> center_locations -> requests -> proposals.
  const tables = [
    'users',
    'musicians',
    'centers',
    'center_locations',
    'private_contacts',
    'requests',
    'request_time_proposals',
    'request_status_history',
    'musician_availability_dates',
    'center_request_dates',
    'alerts',
    'notifications_log',
    'contact_inquiries',
    'site_content',
  ]

  for (const table of tables) {
    const rows = read(table)
    if (rows.length === 0) {
      console.log(`  ${table.padEnd(28)} (empty)`)
      continue
    }

    // users.email is the one column that must not carry over verbatim.
    const payload =
      table === 'users' ? rows.map((r) => ({ ...r, email: stagingEmail(r.email, r.id) })) : rows

    const { error } = await supabase.from(table).upsert(payload, { onConflict: 'id' })
    if (error) {
      console.log(`  ${table.padEnd(28)} FAILED — ${error.message}`)
    } else {
      console.log(`  ${table.padEnd(28)} ${payload.length} rows`)
    }
  }

  console.log(`\nDone. Staging logins use the password: ${STAGING_PASSWORD}`)
  console.log('All addresses were rewritten to @staging.invalid so nothing can reach real members.')
}

main()
