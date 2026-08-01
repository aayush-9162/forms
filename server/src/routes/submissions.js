import express from 'express'
import multer from 'multer'
import crypto from 'node:crypto'
import pool from '../db.js'
import { FORMS } from '../forms.js'
import { requireGoogleAuth } from '../auth.js'
import { afterSubmit } from '../hooks.js'
import {
  uploadBufferToDrive,
  deleteDriveFile,
  isDriveConfigured,
} from '../drive.js'

const maxFileMB = Number(process.env.MAX_FILE_MB) || 10

// Files are kept in memory briefly and streamed straight to Google Drive —
// nothing touches the local disk anymore.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileMB * 1024 * 1024 },
})

const router = express.Router()

function buildMulterFields(fileSpec) {
  return fileSpec.map((spec) => ({
    name: spec.field,
    maxCount: spec.multiple ? 10 : 1,
  }))
}

function parseFieldValue(value) {
  if (value === '' || value === undefined) return null
  return value
}

function coerceBoolean(value) {
  if (value === '' || value === undefined || value === null) return 0
  if (value === true || value === 'true' || value === '1' || value === 1) return 1
  return 0
}

function fileExtension(originalName) {
  const m = String(originalName || '').match(/\.[a-zA-Z0-9]+$/)
  return m ? m[0] : ''
}

// Default naming scheme — formKey + epoch + random + sanitized original name.
function buildDriveFilename(formKey, originalName) {
  const safe = (originalName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_')
  const unique = crypto.randomBytes(6).toString('hex')
  return `${formKey}_${Date.now()}_${unique}_${safe}`
}

// "Question-style" naming for file specs that opt in via `filenamePrefix`.
// Yields names like: OpenSignOn_2026-06-04_14-30-22_managers-opening-checklist-arden.png
function buildQuestionFilename(prefix, formKey, originalName) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
  const ext = fileExtension(originalName)
  return `${prefix}_${datePart}_${timePart}_${formKey}${ext}`
}

// Uploads files one by one. If any single upload fails we attempt to roll
// back the ones that already landed in Drive so the folder doesn't accrue
// orphans across retries.
async function uploadFilesToDrive(formKey, files, folderId, spec) {
  const meta = []
  const uploadedIds = []
  try {
    for (const f of files) {
      const filename = spec?.filenamePrefix
        ? buildQuestionFilename(spec.filenamePrefix, formKey, f.originalname)
        : buildDriveFilename(formKey, f.originalname)
      const driveFile = await uploadBufferToDrive({
        filename,
        mimeType: f.mimetype,
        buffer: f.buffer,
        folderId,
      })
      uploadedIds.push(driveFile.id)
      meta.push({
        original_name: f.originalname,
        drive_file_id: driveFile.id,
        drive_view_link: driveFile.webViewLink || null,
        stored_name: filename,
        size: f.size,
        mime: f.mimetype,
      })
    }
    return meta
  } catch (err) {
    // Best-effort orphan cleanup — log but don't throw if cleanup fails.
    for (const id of uploadedIds) {
      try {
        await deleteDriveFile(id)
        console.log(`[drive] rolled back orphan ${id}`)
      } catch (cleanupErr) {
        console.warn(
          `[drive] could not roll back orphan ${id}:`,
          cleanupErr?.message || cleanupErr
        )
      }
    }
    throw err
  }
}

function getIdempotencyKey(req) {
  const raw = req.header('Idempotency-Key')
  if (!raw) return null
  const trimmed = String(raw).trim()
  if (!trimmed || trimmed.length > 64) return null
  // Restrict to UUID-ish / ASCII identifier chars so it's safe to use as a
  // primary key without further escaping.
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return null
  return trimmed
}

async function findExistingIdempotentInsert(idempotencyKey, formKey) {
  if (!idempotencyKey) return null
  const [rows] = await pool.query(
    'SELECT form_row_id FROM submission_idempotency WHERE idempotency_key = ? AND form_key = ? LIMIT 1',
    [idempotencyKey, formKey]
  )
  return rows[0]?.form_row_id || null
}

async function recordIdempotentInsert(idempotencyKey, formKey, formRowId) {
  if (!idempotencyKey) return
  try {
    await pool.query(
      'INSERT INTO submission_idempotency (idempotency_key, form_key, form_row_id) VALUES (?, ?, ?)',
      [idempotencyKey, formKey, formRowId]
    )
  } catch (err) {
    // Duplicate-key races are fine — someone else recorded the same key.
    if (err?.code !== 'ER_DUP_ENTRY') {
      console.warn('[idempotency] failed to record key:', err.message)
    }
  }
}

router.post('/:formKey', requireGoogleAuth, (req, res, next) => {
  const { formKey } = req.params
  const form = FORMS[formKey]
  if (!form) {
    return res.status(404).json({ error: `Unknown form: ${formKey}` })
  }

  const handler = form.files
    ? upload.fields(buildMulterFields(form.files))
    : upload.none()

  handler(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }

    try {
      const idempotencyKey = getIdempotencyKey(req)

      // If the client retried a submission that already succeeded, return
      // the original insert id instead of inserting a duplicate.
      const existingId = await findExistingIdempotentInsert(
        idempotencyKey,
        formKey
      )
      if (existingId) {
        return res.status(200).json({
          ok: true,
          id: existingId,
          formKey,
          idempotent: true,
        })
      }

      const body = req.body || {}
      const columns = ['email', 'submitted_by_name']
      const values = [req.user.email, req.user.name || null]

      for (const field of form.fields || []) {
        columns.push(field)
        values.push(parseFieldValue(body[field]))
      }

      for (const jsonField of form.json || []) {
        columns.push(jsonField)
        const raw = body[jsonField]
        if (raw === undefined || raw === '' || raw === null) {
          values.push(null)
        } else {
          try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
            values.push(JSON.stringify(parsed))
          } catch {
            return res.status(400).json({
              error: `Invalid JSON for field "${jsonField}"`,
            })
          }
        }
      }

      for (const boolField of form.booleans || []) {
        columns.push(boolField)
        values.push(coerceBoolean(body[boolField]))
      }

      // Upload any files for this form. A form can declare its own Drive
      // folder via `driveFolderEnv`; otherwise files go to the shared
      // IMAGES folder. Each file's Drive metadata is stored in its JSON column.
      if (form.files?.length) {
        const folderEnvName = form.driveFolderEnv || 'IMAGES'
        const folderId = (process.env[folderEnvName] || '').trim()
        const anyFilesPresent = form.files.some(
          (spec) => (req.files?.[spec.field] || []).length > 0
        )
        if (anyFilesPresent) {
          if (!folderId) {
            return res.status(500).json({
              error: `${folderEnvName} folder id is not configured on the server (missing in .env).`,
            })
          }
          if (!isDriveConfigured()) {
            return res.status(500).json({
              error:
                'Google Drive is not configured on the server (run `npm run drive:setup`).',
            })
          }
        }

        for (const spec of form.files) {
          columns.push(spec.column)
          const uploaded = req.files?.[spec.field] || []
          if (uploaded.length === 0) {
            values.push(null)
            continue
          }
          try {
            const meta = await uploadFilesToDrive(
              formKey,
              uploaded,
              folderId,
              spec
            )
            values.push(
              JSON.stringify(spec.multiple ? meta : meta[0])
            )
          } catch (uploadErr) {
            const apiErr = uploadErr?.response?.data?.error
            const msg = apiErr?.message || uploadErr.message
            console.error(
              `[drive] image upload failed for ${formKey} (${spec.field}):`,
              msg
            )
            return res.status(502).json({
              error: `Drive upload failed: ${msg}. Your data has not been saved — please retry.`,
            })
          }
        }
      }

      const placeholders = columns.map(() => '?').join(', ')
      const sql = `INSERT INTO \`${form.table}\` (${columns
        .map((c) => `\`${c}\``)
        .join(', ')}) VALUES (${placeholders})`

      const [result] = await pool.query(sql, values)
      await recordIdempotentInsert(idempotencyKey, formKey, result.insertId)

      res.status(201).json({
        ok: true,
        id: result.insertId,
        formKey,
      })

      const columnValues = {}
      columns.forEach((col, idx) => {
        columnValues[col] = values[idx]
      })
      Promise.resolve()
        .then(() =>
          afterSubmit({
            formKey,
            insertId: result.insertId,
            user: req.user,
            values: columnValues,
          })
        )
        .catch((err) =>
          console.error('[hooks] afterSubmit error:', err?.message || err)
        )
    } catch (error) {
      next(error)
    }
  })
})

export default router
