import 'dotenv/config'
import { isDriveConfigured, uploadBufferToDrive } from './drive.js'
import { generateCashBatchPdf } from './pdfReport.js'

const CASH_DRIVE_FOLDERS = {
  'cash-received-arden': {
    title: 'Cash Batch Report — Arden',
    folderEnv: 'DRIVE_100',
    locationCode: 'A',
  },
  'cash-received-wvl': {
    title: 'Cash Batch Report — Waynesville',
    folderEnv: 'DRIVE_200',
    locationCode: 'W',
  },
}

const MONTH_NAMES = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
]

// Parses a YYYY-MM-DD string into integer parts without any timezone math.
// Returns null if the input doesn't match. Avoids the classic `new Date("2025-05-15")`
// trap where the UTC parse rolls into the previous day in negative-offset locales.
function parsePlainDate(s) {
  if (!s) return null
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return { year: +m[1], month: +m[2], day: +m[3] }
}

// Builds the Drive filename in the form "A BATCH REPORT MAY 15.pdf".
// Falls back to the server's local date if the submitted date is missing or invalid.
function buildBatchReportFilename(locationCode, dateStr) {
  const parsed = parsePlainDate(dateStr)
  let monthIdx, day
  if (parsed) {
    monthIdx = parsed.month - 1
    day = parsed.day
  } else {
    const now = new Date()
    monthIdx = now.getMonth()
    day = now.getDate()
  }
  return `${locationCode} BATCH REPORT ${MONTH_NAMES[monthIdx]} ${day}.pdf`
}

export async function afterSubmit({ formKey, insertId, user, values }) {
  const cashCfg = CASH_DRIVE_FOLDERS[formKey]
  if (cashCfg) {
    const folderId = (process.env[cashCfg.folderEnv] || '').trim()
    if (!folderId) {
      console.warn(
        `[drive] ${cashCfg.folderEnv} is not set in .env — skipping PDF upload.`
      )
      return
    }
    if (!isDriveConfigured()) {
      console.warn(
        '[drive] Drive not configured (missing client_secret or token). Run `npm run drive:setup`.'
      )
      return
    }
    try {
      const pdf = await generateCashBatchPdf({
        title: cashCfg.title,
        submitter: { name: user.name, email: user.email },
        submittedAt: new Date().toLocaleString('en-US', {
          timeZone: 'America/New_York',
        }),
        values,
      })
      const filename = buildBatchReportFilename(
        cashCfg.locationCode,
        values.date
      )
      console.log(
        `[drive] uploading ${filename} → folder ${folderId} (${cashCfg.folderEnv}) for insertId=${insertId}`
      )
      const res = await uploadBufferToDrive({
        filename,
        mimeType: 'application/pdf',
        buffer: pdf,
        folderId,
      })
      console.log(
        `[drive] ✓ uploaded ${filename} → ${res.webViewLink || res.id}`
      )
    } catch (err) {
      const apiErr = err?.response?.data?.error
      console.error(
        '[drive] upload failed:',
        apiErr?.message || err.message,
        apiErr?.code ? `(code ${apiErr.code})` : ''
      )
      if (apiErr?.code === 403) {
        console.error(
          '        → Permission denied. Run `npm run drive:diagnose` to check folder access.'
        )
      }
    }
  }
}
