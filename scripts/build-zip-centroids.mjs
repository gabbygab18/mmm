import fs from 'fs'
import path from 'path'

const rootDir = process.cwd()
const sourcePath = path.join(rootDir, 'zipdata', '2025_Gaz_zcta_national.txt')
const outputPath = path.join(rootDir, 'supabase', 'data', 'zip_centroids.csv')

if (!fs.existsSync(sourcePath)) {
  console.error(`Source file not found: ${sourcePath}`)
  process.exit(1)
}

const raw = fs.readFileSync(sourcePath, 'utf8').trim()
const lines = raw.split(/\r?\n/)

if (lines.length < 2) {
  console.error('Source file does not contain any data rows.')
  process.exit(1)
}

const header = lines[0].split('|')
const geoidIndex = header.indexOf('GEOID')
const latIndex = header.indexOf('INTPTLAT')
const lonIndex = header.indexOf('INTPTLONG')

if (geoidIndex === -1 || latIndex === -1 || lonIndex === -1) {
  console.error('Source file is missing one or more required columns: GEOID, INTPTLAT, INTPTLONG.')
  process.exit(1)
}

const outputLines = ['zip_code,latitude,longitude,city,state']

for (const line of lines.slice(1)) {
  if (!line.trim()) continue
  const parts = line.split('|')
  const zipCode = (parts[geoidIndex] ?? '').trim()
  const latitude = (parts[latIndex] ?? '').trim()
  const longitude = (parts[lonIndex] ?? '').trim()

  if (!zipCode || !latitude || !longitude) continue

  outputLines.push([zipCode, latitude, longitude, '', ''].join(','))
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
fs.writeFileSync(outputPath, `${outputLines.join('\n')}\n`, 'utf8')

console.log(`Wrote ${outputLines.length - 1} ZIP centroid rows to ${outputPath}`)