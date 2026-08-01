import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import 'dotenv/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function run() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  })

  console.log(`Connected to ${process.env.DB_NAME}@${process.env.DB_HOST}`)
  await connection.query(schema)
  console.log('Schema applied successfully. All tables created (or already existed).')
  await connection.end()
}

run().catch((err) => {
  console.error('DB init failed:', err.message)
  process.exit(1)
})
