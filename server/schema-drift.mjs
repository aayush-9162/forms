// Compares schema.sql against the LIVE database and reports every missing
// column, for every form table. Read-only by default; pass --fix to apply.
//
//   node schema-drift.mjs          # report only
//   node schema-drift.mjs --fix    # apply the ALTER TABLEs
//
// Run it from the server/ directory so it picks up that server's .env.
import { readFileSync } from 'node:fs'
import mysql from 'mysql2/promise'
import 'dotenv/config'

const APPLY = process.argv.includes('--fix')
const schemaSql = readFileSync(new URL('./src/schema.sql', `file://${process.cwd().replace(/\\/g, '/')}/`), 'utf8')

// Parse schema.sql into { table: [ {name, ddl}, ... ] }, preserving column order.
const wanted = {}
const tableRe = /CREATE TABLE IF NOT EXISTS\s+`?(\w+)`?\s*\(([\s\S]*?)\n\s*\);/g
let m
while ((m = tableRe.exec(schemaSql))) {
  const [, table, body] = m
  const cols = []
  for (const raw of body.split('\n')) {
    const line = raw.trim().replace(/,$/, '')
    if (!line || /^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN)\b/i.test(line)) continue
    const nm = line.match(/^`?(\w+)`?\s+(.+)$/)
    if (nm) cols.push({ name: nm[1], ddl: line })
  }
  wanted[table] = cols
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

console.log(`connected: ${process.env.DB_USER}@${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`)
console.log(`schema.sql defines ${Object.keys(wanted).length} tables\n`)

const fixes = []
let missingTables = 0

for (const [table, cols] of Object.entries(wanted)) {
  const [exists] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
    [process.env.DB_NAME, table]
  )
  if (!exists[0].n) {
    console.log(`✗ TABLE MISSING ENTIRELY: ${table}`)
    missingTables++
    continue
  }

  const [live] = await conn.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ?`,
    [process.env.DB_NAME, table]
  )
  const have = new Set(live.map((r) => r.COLUMN_NAME ?? r.column_name))
  const gap = cols.filter((c) => !have.has(c.name))

  if (gap.length) {
    console.log(`✗ ${table} — missing ${gap.length} column(s):`)
    for (const c of gap) {
      // place each new column after the one that precedes it in schema.sql,
      // so live column order stays close to the canonical schema
      const idx = cols.findIndex((x) => x.name === c.name)
      const prev = cols.slice(0, idx).reverse().find((x) => have.has(x.name))
      const stmt = `ALTER TABLE \`${table}\` ADD COLUMN ${c.ddl}${prev ? ` AFTER \`${prev.name}\`` : ''};`
      console.log(`    ${c.name}`)
      fixes.push(stmt)
    }
  }
}

if (!fixes.length && !missingTables) {
  console.log('✓ no drift — every table matches schema.sql')
} else {
  console.log(`\n--- ${fixes.length} ALTER statement(s) ---`)
  fixes.forEach((f) => console.log(f))
  if (APPLY) {
    console.log('\napplying...')
    for (const f of fixes) {
      await conn.query(f)
      console.log(`  ok: ${f.slice(0, 78)}...`)
    }
    console.log(`\n✓ applied ${fixes.length} change(s)`)
  } else {
    console.log('\n(report only — re-run with --fix to apply)')
  }
}

await conn.end()
