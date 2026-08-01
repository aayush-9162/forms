import { useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import RadioQuestion from '../../components/RadioQuestion.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { todayIso } from '../../lib/dates.js'
import { MAX_FILE_MB, MAX_FILE_SIZE } from '../../lib/limits.js'

const FORM_KEY = 'customer-service-request'
const DAMAGE_ON_FLOOR = 'DAMAGE ON FLOOR'

const NOTICE_TYPES = [
  'CONTACT CUSTOMER',
  DAMAGE_ON_FLOOR,
  'ARE YOU AWARE',
  'FOLLOW UP',
  'Request Credit',
  'General Notice',
]

function CustomerServiceRequest() {
  const { user } = useAuth()
  // Date is intentionally not persisted — always today on each form open.
  const [date, setDate] = useState(todayIso)
  const [yourName, setYourName] = useDraftState(`${FORM_KEY}.yourName`, user?.name || '')
  const [noticeType, setNoticeType] = useDraftState(`${FORM_KEY}.noticeType`, '')
  const [note, setNote] = useDraftState(`${FORM_KEY}.note`, '')
  // Damage image — Blobs can't be persisted via useDraftState.
  const [damageImage, setDamageImage] = useState(null)
  const [damageImageError, setDamageImageError] = useState('')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const isDamageOnFloor = noticeType === DAMAGE_ON_FLOOR

  const handleNoticeTypeChange = (val) => {
    setNoticeType(val)
    // Drop the file if user switched to a different notice type.
    if (val !== DAMAGE_ON_FLOOR) {
      setDamageImage(null)
      setDamageImageError('')
    }
  }

  const handleDamageFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setDamageImage(null)
      setDamageImageError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setDamageImageError(`"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`)
      return
    }
    setDamageImageError('')
    setDamageImage(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        date,
        your_name: yourName,
        notice_type: noticeType,
        note,
      },
      // Only attach the image when DAMAGE ON FLOOR is selected.
      files: isDamageOnFloor ? { damage_image: damageImage } : null,
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setYourName(user?.name || '')
    setNoticeType('')
    setNote('')
    setDamageImage(null)
    setDamageImageError('')
    reset()
  }

  return (
    <FormShell
      title="Customer Service Request"
      submitted={submitted}
      queued={queued}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      onReset={handleReset}
    >
      <FormRow>
        <FormField label="Email" hint="Auto-filled from your Google account.">
          <input
            type="email"
            readOnly
            value={user?.email || ''}
            className={`${inputClass} bg-slate-50 cursor-not-allowed`}
          />
        </FormField>

        <FormField label="Date" required>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <FormField label="Your Name" required>
        <input
          type="text"
          required
          value={yourName}
          onChange={(e) => setYourName(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <RadioQuestion
        label="Type Of Notice"
        required
        name="noticeType"
        options={NOTICE_TYPES}
        value={noticeType}
        onChange={handleNoticeTypeChange}
      />

      {isDamageOnFloor && (
        <FormField
          label="Upload damage picture"
          required
          hint={`Max ${MAX_FILE_MB} MB.`}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            required
            onChange={handleDamageFile}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
          />
          {damageImageError && (
            <p className="text-xs text-rose-600 mt-1.5">{damageImageError}</p>
          )}
          {damageImage && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
              <span className="flex-1 truncate">{damageImage.name}</span>
              <span className="text-xs text-slate-500">
                {(damageImage.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </FormField>
      )}

      <FormField label="Note">
        <textarea
          rows="4"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
        />
      </FormField>
    </FormShell>
  )
}

export default CustomerServiceRequest
