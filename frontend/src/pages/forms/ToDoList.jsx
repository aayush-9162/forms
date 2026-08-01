import { useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { MAX_FILE_MB, MAX_FILE_SIZE } from '../../lib/limits.js'

const FORM_KEY = 'to-do-list'

function ToDoList() {
  const { user } = useAuth()
  const [yourName, setYourName] = useDraftState(`${FORM_KEY}.yourName`, user?.name || '')
  const [task, setTask] = useDraftState(`${FORM_KEY}.task`, '')
  const [extNo, setExtNo] = useDraftState(`${FORM_KEY}.extNo`, '')
  const [remarks, setRemarks] = useDraftState(`${FORM_KEY}.remarks`, '')
  // File uploads can't be persisted — Blobs aren't JSON-serializable.
  const [attachment, setAttachment] = useState(null)
  const [fileError, setFileError] = useState('')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setAttachment(null)
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`)
      return
    }
    setFileError('')
    setAttachment(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        your_name: yourName,
        task,
        ext_no: extNo,
        remarks,
      },
      files: { attachment },
    })
  }

  const handleReset = () => {
    setYourName(user?.name || '')
    setTask('')
    setExtNo('')
    setAttachment(null)
    setFileError('')
    setRemarks('')
    reset()
  }

  return (
    <FormShell
      title="To Do List"
      description="Help organize your tasks for the day."
      submitted={submitted}
      queued={queued}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      onReset={handleReset}
    >
      <FormRow>
        <FormField label="Email" required hint="Auto-filled from your Google account.">
          <input
            type="email"
            readOnly
            value={user?.email || ''}
            className={`${inputClass} bg-slate-50 cursor-not-allowed`}
          />
        </FormField>

        <FormField label="Your Name">
          <input
            type="text"
            value={yourName}
            onChange={(e) => setYourName(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <FormField label="Explain The Task">
        <textarea
          rows="4"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormRow>
        <FormField label="EXT No">
          <input
            type="text"
            value={extNo}
            onChange={(e) => setExtNo(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Attachment"
          hint="Upload 1 supported file. Max 10 MB."
        >
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
          />
          {fileError && (
            <p className="text-xs text-rose-600 mt-1.5">{fileError}</p>
          )}
          {attachment && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
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
              <span className="flex-1 truncate">{attachment.name}</span>
              <span className="text-xs text-slate-500">
                {(attachment.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </FormField>
      </FormRow>

      <FormField label="Remarks">
        <textarea
          rows="3"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className={inputClass}
        />
      </FormField>
    </FormShell>
  )
}

export default ToDoList
