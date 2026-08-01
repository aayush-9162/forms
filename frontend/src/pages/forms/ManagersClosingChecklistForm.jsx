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

const CHECK_OPTIONS = ['Yes', 'No', 'NA', 'See Comments']

function ManagersClosingChecklistForm({
  title,
  formKey,
  checklistItems,
  noPickupsItem,
}) {
  const { user } = useAuth()
  // Date is intentionally not persisted — always today on each form open.
  const [date, setDate] = useState(todayIso)
  const [name, setName] = useDraftState(`${formKey}.name`, user?.name || '')
  const [checklist, setChecklist] = useDraftState(`${formKey}.checklist`, {})
  const [scannedChecks, setScannedChecks] = useDraftState(`${formKey}.scannedChecks`, '')
  const [sentReport, setSentReport] = useDraftState(`${formKey}.sentReport`, '')
  const [comment, setComment] = useDraftState(`${formKey}.comment`, '')
  const [talkingPoints, setTalkingPoints] = useDraftState(`${formKey}.talkingPoints`, '')
  const [extNo, setExtNo] = useDraftState(`${formKey}.extNo`, '')
  const [birdeyeReviewsRequested, setBirdeyeReviewsRequested] = useDraftState(
    `${formKey}.birdeyeReviewsRequested`,
    ''
  )
  // Dispatch screenshot — file Blobs can't be persisted via useDraftState.
  const [dispatchScreenshot, setDispatchScreenshot] = useState(null)
  const [dispatchScreenshotError, setDispatchScreenshotError] = useState('')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(formKey)

  const noPickupsIsYes =
    noPickupsItem && checklist[noPickupsItem] === 'Yes'

  const setChecklistAnswer = (itemKey) => (val) => {
    setChecklist((prev) => ({ ...prev, [itemKey]: val }))
    // If they switch the DT "no pickups" row away from Yes, drop the file
    // so it doesn't get submitted with a mismatched answer.
    if (itemKey === noPickupsItem && val !== 'Yes') {
      setDispatchScreenshot(null)
      setDispatchScreenshotError('')
    }
  }

  const handleDispatchFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setDispatchScreenshot(null)
      setDispatchScreenshotError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setDispatchScreenshotError(
        `"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`
      )
      return
    }
    setDispatchScreenshotError('')
    setDispatchScreenshot(file)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        date,
        name,
        checklist,
        scanned_checks_to_bank: scannedChecks,
        sent_report_to_team_india: sentReport,
        comment,
        talking_points: talkingPoints,
        ext_no: extNo,
        birdeye_reviews_requested: birdeyeReviewsRequested,
      },
      // Only attach the dispatch screenshot when the DT "no pickups" row is
      // answered Yes — otherwise it doesn't apply.
      files: noPickupsIsYes
        ? { dt_no_pickups_screenshot: dispatchScreenshot }
        : null,
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setName(user?.name || '')
    setChecklist({})
    setScannedChecks('')
    setSentReport('')
    setComment('')
    setTalkingPoints('')
    setExtNo('')
    setBirdeyeReviewsRequested('')
    setDispatchScreenshot(null)
    setDispatchScreenshotError('')
    reset()
  }

  return (
    <FormShell
      title={title}
      notShared
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

      <FormRow>
        <FormField label="Name" required>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="EXT NO">
          <input
            type="text"
            value={extNo}
            onChange={(e) => setExtNo(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <div className="mb-6">
        <h3 className="block text-sm font-semibold text-slate-700 mb-3">
          Closing Checklist
          <span className="text-rose-500 ml-0.5">*</span>
        </h3>
        <div className="space-y-3">
          {checklistItems.map((item) => {
            const isNoPickupsRow = item === noPickupsItem
            const showUpload = isNoPickupsRow && noPickupsIsYes
            return (
              <div
                key={item}
                className="bg-slate-50/40 border border-slate-200 rounded-lg p-4"
              >
                <RadioQuestion
                  label={item}
                  required
                  horizontal
                  name={`checklist__${item}`}
                  options={CHECK_OPTIONS}
                  value={checklist[item]}
                  onChange={setChecklistAnswer(item)}
                />
                {showUpload && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Upload screenshot from dispatch
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      required
                      onChange={handleDispatchFile}
                      className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
                    />
                    {dispatchScreenshotError && (
                      <p className="text-xs text-rose-600 mt-1.5">
                        {dispatchScreenshotError}
                      </p>
                    )}
                    {dispatchScreenshot && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg">
                        <span className="flex-1 truncate">
                          {dispatchScreenshot.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(dispatchScreenshot.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1.5 italic">
                      Max {MAX_FILE_MB} MB.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-slate-50/40 border border-slate-200 rounded-lg">
        <label
          htmlFor="birdeyeReviewsRequested"
          className="text-sm font-semibold text-slate-700"
        >
          How many Birdeye reviews did you ask from customers?
          <span className="text-rose-500 ml-0.5">*</span>
        </label>
        <input
          id="birdeyeReviewsRequested"
          type="number"
          min="0"
          required
          value={birdeyeReviewsRequested}
          onChange={(e) => setBirdeyeReviewsRequested(e.target.value)}
          className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-400 transition-all"
        />
      </div>

      <FormRow>
        <RadioQuestion
          label="Scanned Checks to Bank"
          required
          name="scannedChecks"
          options={['YES', 'No']}
          value={scannedChecks}
          onChange={setScannedChecks}
        />

        <RadioQuestion
          label="Sent Check and Cash Report to Team India"
          required
          name="sentReport"
          options={['Yes', 'No']}
          value={sentReport}
          onChange={setSentReport}
        />
      </FormRow>

      <FormField label="Comment">
        <textarea
          rows="3"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField
        label="List Your Talking Points For Next Day Sales Meeting With Sales Staff"
        required
      >
        <textarea
          rows="4"
          required
          value={talkingPoints}
          onChange={(e) => setTalkingPoints(e.target.value)}
          className={inputClass}
        />
      </FormField>
    </FormShell>
  )
}

export default ManagersClosingChecklistForm
