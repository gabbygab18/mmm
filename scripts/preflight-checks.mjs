import fs from 'fs'
import path from 'path'

const root = process.cwd()
const appDir = path.join(root, 'src', 'app')

function walk(dir, result = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, result)
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      result.push(fullPath)
    }
  }
  return result
}

function normalize(filePath) {
  return path.relative(root, filePath).split(path.sep).join('/')
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const issues = []

  const defaultFnMatches = content.match(/export\s+default\s+.*function/g) ?? []
  if (defaultFnMatches.length > 1) {
    issues.push(`multiple default function exports (${defaultFnMatches.length})`)
  }

  const orphanJsxPattern = /^\s*<\w[\s\S]*$/m
  const lines = content.split('\n')
  const lastNonEmptyIndex = [...lines].reverse().findIndex((line) => line.trim().length > 0)
  if (lastNonEmptyIndex !== -1) {
    const index = lines.length - 1 - lastNonEmptyIndex
    const tail = lines.slice(index).join('\n')
    if (orphanJsxPattern.test(tail)) {
      issues.push('suspicious top-level JSX tail after module code')
    }
  }

  const duplicateHandleForm = (content.match(/<form\s+onSubmit=\{handleSubmit\}/g) ?? []).length
  if (duplicateHandleForm > 1) {
    issues.push(`multiple handleSubmit forms found (${duplicateHandleForm})`)
  }

  return issues
}

if (!fs.existsSync(appDir)) {
  console.error('Could not find src/app directory.')
  process.exit(1)
}

const files = walk(appDir)
let failureCount = 0

for (const file of files) {
  const issues = checkFile(file)
  if (issues.length > 0) {
    failureCount += issues.length
    console.error(`\n[preflight] ${normalize(file)}`)
    for (const issue of issues) {
      console.error(`  - ${issue}`)
    }
  }
}

if (failureCount > 0) {
  console.error(`\nPreflight failed with ${failureCount} issue(s).`)
  process.exit(1)
}

console.log(`Preflight passed: checked ${files.length} .tsx file(s).`)
