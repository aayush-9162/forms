import { useState } from 'react'
import { submitForm, SubmissionError } from '../api/submissions.js'
import { useAuth } from '../context/AuthContext.jsx'
import { enqueueSubmission } from '../outbox/queue.js'
import { retryNow } from '../outbox/retrier.js'
import { archiveSubmission } from '../outbox/archive.js'
import { clearFormDraft } from './useDraftState.js'

function newIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function useSubmitForm(formKey) {
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [queued, setQueued] = useState(false)
  const [error, setError] = useState('')

  async function submit({ fields, files }) {
    setSubmitting(true)
    setError('')
    const idempotencyKey = newIdempotencyKey()
    try {
      const result = await submitForm({
        formKey,
        fields,
        files,
        credential: user?.credential,
        idempotencyKey,
      })
      // 24h local backup — recoverable from the employee's browser if
      // anything downstream silently goes wrong.
      archiveSubmission({
        formKey,
        fields,
        files,
        submittedBy: user,
        serverId: result?.id || null,
        status: 'submitted',
      })
      clearFormDraft(formKey)
      setSubmitted(true)
    } catch (err) {
      // Terminal errors mean the server rejected the data — don't queue,
      // show the error so the user can fix it.
      if (err instanceof SubmissionError && !err.transient) {
        setError(err.message || 'Submission failed.')
        return
      }
      // Transient: save to the outbox for later retry. Do NOT archive here —
      // the archive only holds server-accepted data. While the submission is
      // pending, the outbox is the storage; once it finally lands, the
      // retrier writes to the archive at that point.
      try {
        await enqueueSubmission({ formKey, fields, files, idempotencyKey })
        clearFormDraft(formKey)
        setQueued(true)
        retryNow()
      } catch (storageErr) {
        setError(
          `${err.message || 'Submission failed.'} Also failed to save locally: ${storageErr.message || storageErr}`
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setSubmitted(false)
    setQueued(false)
    setError('')
  }

  return { submit, submitting, submitted, queued, error, reset }
}
