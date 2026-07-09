const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const envLines = fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
const getEnv = (key) => {
  const line = envLines.find((row) => row.startsWith(`${key}=`))
  return line ? line.slice(key.length + 1).replace(/^"|"$/g, '') : ''
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL')
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY')

if (!url || !key) {
  console.error('Missing Supabase URL or anon key in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function main() {
  const payloads = [
    {
      label: 'all-args',
      value: {
        target_location_id: '00000000-0000-0000-0000-000000000000',
        result_limit: 1,
        days_ahead: 1,
        radius_boost_miles: 0,
      },
    },
    {
      label: 'required-only',
      value: {
        target_location_id: '00000000-0000-0000-0000-000000000000',
      },
    },
  ]

  for (const payload of payloads) {
    const { data, error } = await supabase.rpc('get_nearby_musician_slots_for_center_with_expansion', payload.value)
    if (error) {
      console.log(`RPC_ERROR_${payload.label}:`, error.message)
    } else {
      console.log(`RPC_OK_${payload.label}`, Array.isArray(data) ? data.length : 0)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(3)
})
