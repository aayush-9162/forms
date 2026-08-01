import mysql from 'mysql2/promise'
import 'dotenv/config'

// No `timezone` option here — mysql2 defaults to "local", which matches
// the MySQL session timezone. The DB's CURRENT_TIMESTAMP returns wall-clock
// time in MySQL's session tz, and the Node process converts it to a
// JavaScript Date using the same tz, so round-trips stay correct.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
})

export default pool
