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

const CONTACT_CUSTOMER = 'CONTACT CUSTOMER'
const DAMAGE_ON_FLOOR = 'DAMAGE ON FLOOR'
const ARE_YOU_AWARE = 'ARE YOU AWARE'
const FOLLOW_UP = 'FOLLOW UP'
const REQUEST_CREDIT = 'Request Credit'
const GENERAL_NOTICE = 'General Notice'

const NOTICE_TYPES = [
  CONTACT_CUSTOMER,
  DAMAGE_ON_FLOOR,
  ARE_YOU_AWARE,
  FOLLOW_UP,
  REQUEST_CREDIT,
  GENERAL_NOTICE,
]

// Notice types that collect a customer contact + a problem description.
const CONTACT_TYPES = [CONTACT_CUSTOMER, REQUEST_CREDIT]
const MAX_PHOTOS = 10

const fileInputClass =
  'block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer'

function CustomerServiceRequest() {
  const { user } = useAuth()
  // Date is intentionally not persisted — always today on each form open.
  const [date, setDate] = useState(todayIso)
  const [yourName, setYourName] = useDraftState(`${FORM_KEY}.yourName`, user?.name || '')
  const [noticeType, setNoticeType] = useDraftState(`${FORM_KEY}.noticeType`, '')

  // Contact-style fields (CONTACT CUSTOMER / Request Credit)
  const [customerName, setCustomerName] = useDraftState(`${FORM_KEY}.customerName`, '')
  const [phone, setPhone] = useDraftState(`${FORM_KEY}.phone`, '')
  // Damage-style fields (DAMAGE ON FLOOR)
  const [itemId, setItemId] = useDraftState(`${FORM_KEY}.itemId`, '')
  const [barCode, setBarCode] = useDraftState(`${FORM_KEY}.barCode`, '')
  const [location, setLocation] = useDraftState(`${FORM_KEY}.location`, '')
  // Shared by contact + damage
  const [descriptionOfProblem, setDescriptionOfProblem] = useDraftState(
    `${FORM_KEY}.descriptionOfProblem`,
    ''
  )
  // Note-style fields (ARE YOU AWARE / FOLLOW UP / General Notice)
  const [note, setNote] = useDraftState(`${FORM_KEY}.note`, '')
  // Damage photos — Blobs can't be persisted via useDraftState.
  const [photos, setPhotos] = useState([])
  const [photoError, setPhotoError] = useState('')

  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const isContact = CONTACT_TYPES.includes(noticeType)
  const isDamage = noticeType === DAMAGE_ON_FLOOR
  const isNote = Boolean(noticeType) && !isContact && !isDamage

  const handleNoticeTypeChange = (val) => {
    setNoticeType(val)
    if (val !== DAMAGE_ON_FLOOR) {
      setPhotos([])
      setPhotoError('')
    }
  }

  const handlePhotos = (e) => {
    const incoming = Array.from(e.target.files || [])
    // Reset the input so picking the same file again (or re-opening) still fires.
    e.target.value = ''
    if (!incoming.length) return

    const tooBig = incoming.find((f) => f.size > MAX_FILE_SIZE)
    if (tooBig) {
      setPhotoError(`"${tooBig.name}" exceeds the ${MAX_FILE_MB} MB limit.`)
      return
    }

    // Append to the existing selection instead of replacing it, skipping
    // duplicates (same name + size).
    const seen = new Set(photos.map((f) => `${f.name}:${f.size}`))
    const merged = [...photos]
    for (const f of incoming) {
      const key = `${f.name}:${f.size}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(f)
      }
    }

    if (merged.length > MAX_PHOTOS) {
      setPhotos(merged.slice(0, MAX_PHOTOS))
      setPhotoError(`You can attach up to ${MAX_PHOTOS} files.`)
    } else {
      setPhotos(merged)
      setPhotoError('')
    }
  }

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
    setPhotoError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        date,
        your_name: yourName,
        notice_type: noticeType,
        customer_name: isContact ? customerName : '',
        phone: isContact ? phone : '',
        item_id: isDamage ? itemId : '',
        bar_code: isDamage ? barCode : '',
        location: isDamage ? location : '',
        description_of_problem: isContact || isDamage ? descriptionOfProblem : '',
        note: isNote ? note : '',
      },
      files: isDamage && photos.length ? { damage_image: photos } : null,
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setYourName(user?.name || '')
    setNoticeType('')
    setCustomerName('')
    setPhone('')
    setItemId('')
    setBarCode('')
    setLocation('')
    setDescriptionOfProblem('')
    setNote('')
    setPhotos([])
    setPhotoError('')
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

      {/* CONTACT CUSTOMER / Request Credit */}
      {isContact && (
        <>
          <FormRow>
            <FormField label="Customer Name" required>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Phone #" required>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </FormRow>
          <FormField label="Description Of Problem" required>
            <textarea
              rows="4"
              required
              value={descriptionOfProblem}
              onChange={(e) => setDescriptionOfProblem(e.target.value)}
              className={inputClass}
            />
          </FormField>
        </>
      )}

      {/* DAMAGE ON FLOOR */}
      {isDamage && (
        <>
          <FormRow>
            <FormField label="Item ID" required>
              <input
                type="text"
                required
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="Bar Code #" required>
              <input
                type="text"
                required
                value={barCode}
                onChange={(e) => setBarCode(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </FormRow>
          <FormField label="Location" required>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField label="Description Of Problem" required>
            <textarea
              rows="4"
              required
              value={descriptionOfProblem}
              onChange={(e) => setDescriptionOfProblem(e.target.value)}
              className={inputClass}
            />
          </FormField>
          <FormField
            label="Photo"
            hint={`Upload up to ${MAX_PHOTOS} supported files. Max ${MAX_FILE_MB} MB per file.`}
          >
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handlePhotos}
              className={fileInputClass}
            />
            {photoError && (
              <p className="text-xs text-rose-600 mt-1.5">{photoError}</p>
            )}
            {photos.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="text-xs text-slate-500">
                  {photos.length} of {MAX_PHOTOS} file
                  {photos.length === 1 ? '' : 's'} selected
                </div>
                {photos.map((f, i) => (
                  <div
                    key={`${f.name}:${f.size}:${i}`}
                    className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg"
                  >
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-slate-500">
                      {(f.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="text-slate-400 hover:text-rose-600 text-lg leading-none px-1"
                      aria-label={`Remove ${f.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormField>
        </>
      )}

      {/* ARE YOU AWARE / FOLLOW UP / General Notice */}
      {isNote && (
        <FormField label="Note">
          <textarea
            rows="4"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </FormField>
      )}
    </FormShell>
  )
}

export default CustomerServiceRequest
