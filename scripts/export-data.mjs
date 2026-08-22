/**
 * Full data export via the service-role client.
 *
 * `supabase db dump` needs Docker and pg_dump, neither of which is installed
 * here, so this pulls every table over the API instead and writes one JSON
 * file per table plus a manifest. Service-role, so RLS does not silently
 * truncate the export — that is the whole point: a backup that quietly
 * omitted rows would be worse than no backup.
 *
 * Usage: node scripts/export-data.mjs <outputDir>
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const outDir = process.argv[2]
if (!outDir) {
  console.error('Usage: node scripts/export-data.mjs <outputDir>')
  process.exit(1)
}
mkdirSync(outDir, { recursive: true })

const supabase = createClient(url, key, { auth: { persistSession: false } })

const TABLES = [
  'users',
  'musicians',
  'centers',
  'center_locations',
  'requests',
  'request_time_proposals',
  'request_status_history',
  'alerts',
  'notifications_log',
  'musician_availability_dates',
  'center_request_dates',
  'site_content',
  'contact_inquiries',
]

const manifest = { exportedAt: new Date().toISOString(), tables: {} }

for (const table of TABLES) {
  // Paged: a plain select caps out at the API's row limit, which would
  // silently produce a short backup on any table that grows past it.
  const rows = []
  const pageSize = 1000
  let from = 0
  let failed = null

  for (;;) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + pageSize - 1)
    if (error) {
      failed = error.message
      break
    }
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }

  if (failed) {
    console.log(`  ${table.padEnd(28)} SKIPPED (${failed})`)
    manifest.tables[table] = { error: failed }
    continue
  }

  writeFileSync(join(outDir, `${table}.json`), JSON.stringify(rows, null, 2))
  console.log(`  ${table.padEnd(28)} ${rows.length} rows`)
  manifest.tables[table] = { rows: rows.length }
}

// auth.users is not reachable through the REST schema — it needs the admin
// API. Without it a restore could not recreate logins at all.
try {
  const authUsers = []
  let page = 1
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    authUsers.push(...(data?.users ?? []))
    if (!data?.users?.length || data.users.length < 1000) break
    page += 1
  }
  writeFileSync(join(outDir, 'auth_users.json'), JSON.stringify(authUsers, null, 2))
  console.log(`  ${'auth.users'.padEnd(28)} ${authUsers.length} rows`)
  manifest.tables['auth.users'] = { rows: authUsers.length }
} catch (e) {
  console.log(`  ${'auth.users'.padEnd(28)} FAILED (${e.message})`)
  manifest.tables['auth.users'] = { error: e.message }
}

writeFileSync(join(outDir, '_manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\nWritten to ${outDir}`)
