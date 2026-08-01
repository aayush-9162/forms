import { useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import RadioQuestion, { OTHER_VALUE } from '../../components/RadioQuestion.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { MAX_FILE_MB, MAX_FILE_SIZE } from '../../lib/limits.js'
import { todayIso } from '../../lib/dates.js'

const FORM_KEY = 'part-received'
const MAX_FILES = 5

function PartReceived() {
  const { user } = useAuth()
  // Date is intentionally not persisted — always today on each form open.
  const [date, setDate] = useState(todayIso)
  const [yourName, setYourName] = useDraftState(`${FORM_KEY}.yourName`, user?.name || '')
  const [partReceived, setPartReceived] = useDraftState(`${FORM_KEY}.partReceived`, false)
  const [needPO, setNeedPO] = useDraftState(`${FORM_KEY}.needPO`, false)
  const [shippingCompany, setShippingCompany] = useDraftState(`${FORM_KEY}.shippingCompany`, '')
  const [shippingCompanyOther, setShippingCompanyOther] = useDraftState(`${FORM_KEY}.shippingCompanyOther`, '')
  const [vendor, setVendor] = useDraftState(`${FORM_KEY}.vendor`, '')
  const [comment, setComment] = useDraftState(`${FORM_KEY}.comment`, '')
  // File uploads can't be persisted — Blobs aren't JSON-serializable.
  const [files, setFiles] = useState([])
  const [fileError, setFileError] = useState('')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length > MAX_FILES) {
      setFileError(`You can upload up to ${MAX_FILES} files.`)
      return
    }
    const oversized = selected.find((f) => f.size > MAX_FILE_SIZE)
    if (oversized) {
      setFileError(`"${oversized.name}" exceeds the ${MAX_FILE_MB} MB limit.`)
      return
    }
    setFileError('')
    setFiles(selected)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        date,
        your_name: yourName,
        part_received: partReceived,
        need_po: needPO,
        shipping_company:
          shippingCompany === OTHER_VALUE
            ? `Other: ${shippingCompanyOther}`
            : shippingCompany,
        vendor,
        comment,
      },
      files: { files },
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setYourName(user?.name || '')
    setPartReceived(false)
    setNeedPO(false)
    setShippingCompany('')
    setShippingCompanyOther('')
    setVendor('')
    setFiles([])
    setFileError('')
    setComment('')
    reset()
  }

  return (
    <FormShell
      title="Part Received"
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

        <FormField label="Date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Your Name" required>
          <input
            type="text"
            required
            placeholder="test"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="Vendor" required>
          <input
            type="text"
            required
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors">
          <input
            type="checkbox"
            checked={partReceived}
            onChange={(e) => setPartReceived(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer rounded"
          />
          <span className="font-medium">Part Received</span>
        </label>
        <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors">
          <input
            type="checkbox"
            checked={needPO}
            onChange={(e) => setNeedPO(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer rounded"
          />
          <span className="font-medium">Need PO</span>
        </label>
      </div>

      <RadioQuestion
        label="Shipping Company"
        required
        name="shippingCompany"
        options={['USPS', 'UPS', 'FedEx']}
        value={shippingCompany}
        onChange={setShippingCompany}
        allowOther
        otherValue={shippingCompanyOther}
        onOtherChange={setShippingCompanyOther}
      />

      <FormField
        label="Picture Shipping Label and Packing Slip"
        hint={`Upload up to ${MAX_FILES} supported files. Max ${MAX_FILE_MB} MB per file.`}
      >
        <input
          type="file"
          multiple
          accept="image/*,.pdf"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
        />
        {fileError && (
          <p className="text-xs text-rose-600 mt-1.5">{fileError}</p>
        )}
        {files.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {files.map((f) => (
              <li
                key={f.name}
                className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs text-slate-500">
                  {(f.size / 1024).toFixed(1)} KB
                </span>
              </li>
            ))}
          </ul>
        )}
      </FormField>

      <FormField label="Comment">
        <textarea
          rows="3"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={inputClass}
        />
      </FormField>
    </FormShell>
  )
}

export default PartReceived
