import express from 'express'
import pool from '../db.js'
import { FORMS } from '../forms.js'
import { requireGoogleAuth } from '../auth.js'

const router = express.Router()

// Reports contain every user's submitted data — must be authenticated.
router.use(requireGoogleAuth)

// Summary — list of every form + its row count.
router.get('/summary', async (_req, res, next) => {
  try {
    const out = {}
    await Promise.all(
      Object.entries(FORMS).map(async ([key, form]) => {
        try {
          const [rows] = await pool.query(
            `SELECT COUNT(*) AS total FROM \`${form.table}\``
          )
          out[key] = { table: form.table, count: rows[0].total }
        } catch {
          out[key] = { table: form.table, count: 0, error: true }
        }
      })
    )
    res.json({ ok: true, summary: out })
  } catch (err) {
    next(err)
  }
})

// List submissions for one form (paginated, newest first).
router.get('/:formKey', async (req, res, next) => {
  const { formKey } = req.params
  const form = FORMS[formKey]
  if (!form) return res.status(404).json({ error: `Unknown form: ${formKey}` })

  const limit = Math.min(Number(req.query.limit) || 200, 1000)
  const offset = Math.max(Number(req.query.offset) || 0, 0)

  try {
    const [rows] = await pool.query(
      `SELECT * FROM \`${form.table}\` ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    )
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM \`${form.table}\``
    )
    res.json({
      ok: true,
      formKey,
      total: countRows[0].total,
      limit,
      offset,
      rows,
    })
  } catch (err) {
    next(err)
  }
})

// Single submission by id.
router.get('/:formKey/:id', async (req, res, next) => {
  const { formKey, id } = req.params
  const form = FORMS[formKey]
  if (!form) return res.status(404).json({ error: `Unknown form: ${formKey}` })

  try {
    const [rows] = await pool.query(
      `SELECT * FROM \`${form.table}\` WHERE id = ? LIMIT 1`,
      [Number(id)]
    )
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json({ ok: true, formKey, row: rows[0] })
  } catch (err) {
    next(err)
  }
})

export default router
