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

// Shared body for both Managers Opening Checklist locations (Arden +
// Waynesville). Each location passes its own item list. Per item:
//   { key, label, yesPrompt }   → when Yes, show a text input
//   { key, label, yesUpload: true } → when Yes, show a file upload (only the
//                                     Open Sign On row uses this today)

const CHECK_OPTIONS = ['Yes', 'No', 'See Comments']
const YES_NO = ['Yes', 'No']

function ManagersOpeningChecklistForm({ title, formKey, checklistItems }) {
  const { user } = useAuth()
  // Date is intentionally not persisted — always today on each form open.
  const [date, setDate] = useState(todayIso)
  const [name, setName] = useDraftState(`${formKey}.name`, user?.name || '')
  const [checklist, setChecklist] = useDraftState(`${formKey}.checklist`, {})
  // Map of item key → name string. Only populated for items answered "Yes".
  const [checklistNames, setChecklistNames] = useDraftState(
    `${formKey}.checklistNames`,
    {}
  )
  const [comments, setComments] = useDraftState(`${formKey}.comments`, '')
  const [extNo, setExtNo] = useDraftState(`${formKey}.extNo`, '')

  // Three new yes/no questions + describe
  const [preparedForSalesMeeting, setPreparedForSalesMeeting] = useDraftState(
    `${formKey}.preparedForSalesMeeting`,
    ''
  )
  const [preparedForSalesMeetingDescribe, setPreparedForSalesMeetingDescribe] =
    useDraftState(`${formKey}.preparedForSalesMeetingDescribe`, '')
  const [allTeamMembersArrived, setAllTeamMembersArrived] = useDraftState(
    `${formKey}.allTeamMembersArrived`,
    ''
  )
  const [askedForQuoteSheet, setAskedForQuoteSheet] = useDraftState(
    `${formKey}.askedForQuoteSheet`,
    ''
  )
  const [assignedWork, setAssignedWork] = useDraftState(
    `${formKey}.assignedWork`,
    ''
  )
  const [assignedWorkDescribe, setAssignedWorkDescribe] = useDraftState(
    `${formKey}.assignedWorkDescribe`,
    ''
  )

  // Open Sign On image (the lone upload row). Blobs can't go through
  // useDraftState. There's at most one upload row per form today.
  const uploadItem = checklistItems.find((item) => item.yesUpload)
  const [openSignOnImage, setOpenSignOnImage] = useState(null)
  const [openSignOnImageError, setOpenSignOnImageError] = useState('')

  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(formKey)

  const setChecklistAnswer = (itemKey) => (val) => {
    setChecklist((prev) => ({ ...prev, [itemKey]: val }))
    // If they switched away from Yes, drop the captured follow-up (name OR
    // file) so the submission stays consistent with the answer.
    if (val !== 'Yes') {
      if (uploadItem && itemKey === uploadItem.key) {
        setOpenSignOnImage(null)
        setOpenSignOnImageError('')
      }
      setChecklistNames((prev) => {
        if (!(itemKey in prev)) return prev
        const next = { ...prev }
        delete next[itemKey]
        return next
      })
    }
  }

  const setChecklistName = (itemKey) => (val) => {
    setChecklistNames((prev) => ({ ...prev, [itemKey]: val }))
  }

  const handleOpenSignOnFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setOpenSignOnImage(null)
      setOpenSignOnImageError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setOpenSignOnImageError(
        `"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`
      )
      return
    }
    setOpenSignOnImageError('')
    setOpenSignOnImage(file)
  }

  const openSignOnIsYes =
    uploadItem && checklist[uploadItem.key] === 'Yes'

  const handleSubmit = (e) => {
    e.preventDefault()
    // Strip the upload item's key from checklistNames in case a stale text
    // entry exists from before we switched it to an upload row.
    const cleanedNames = uploadItem
      ? Object.fromEntries(
          Object.entries(checklistNames).filter(
            ([k]) => k !== uploadItem.key
          )
        )
      : checklistNames
    submit({
      fields: {
        date,
        name,
        checklist,
        checklist_names: cleanedNames,
        comments,
        ext_no: extNo,
        prepared_for_sales_meeting: preparedForSalesMeeting,
        prepared_for_sales_meeting_describe: preparedForSalesMeetingDescribe,
        all_team_members_arrived: allTeamMembersArrived,
        asked_for_quote_sheet: askedForQuoteSheet,
        assigned_work: assignedWork,
        assigned_work_describe:
          assignedWork === 'Yes' ? assignedWorkDescribe : '',
      },
      files: openSignOnIsYes
        ? { open_sign_on_image: openSignOnImage }
        : null,
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setName(user?.name || '')
    setChecklist({})
    setChecklistNames({})
    setComments('')
    setExtNo('')
    setPreparedForSalesMeeting('')
    setPreparedForSalesMeetingDescribe('')
    setAllTeamMembersArrived('')
    setAskedForQuoteSheet('')
    setAssignedWork('')
    setAssignedWorkDescribe('')
    setOpenSignOnImage(null)
    setOpenSignOnImageError('')
    reset()
  }

  const preparedForSalesMeetingIsYes = preparedForSalesMeeting === 'Yes'

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
          Opening Checklist
          <span className="text-rose-500 ml-0.5">*</span>
        </h3>
        <div className="space-y-3">
          {checklistItems.map((item) => {
            const answer = checklist[item.key]
            const isYes = answer === 'Yes'
            return (
              <div
                key={item.key}
                className="bg-slate-50/40 border border-slate-200 rounded-lg p-4"
              >
                <RadioQuestion
                  label={item.label}
                  required
                  horizontal
                  name={`checklist__${item.key}`}
                  options={CHECK_OPTIONS}
                  value={answer}
                  onChange={setChecklistAnswer(item.key)}
                />
                {isYes && item.yesUpload && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Upload picture
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      required
                      onChange={handleOpenSignOnFile}
                      className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
                    />
                    {openSignOnImageError && (
                      <p className="text-xs text-rose-600 mt-1.5">
                        {openSignOnImageError}
                      </p>
                    )}
                    {openSignOnImage && (
                      <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-white border border-slate-200 px-3 py-2 rounded-lg">
                        <span className="flex-1 truncate">
                          {openSignOnImage.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          {(openSignOnImage.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-1.5 italic">
                      Max {MAX_FILE_MB} MB.
                    </p>
                  </div>
                )}
                {isYes && !item.yesUpload && (
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {item.yesPrompt}
                      <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={checklistNames[item.key] || ''}
                      onChange={(e) =>
                        setChecklistName(item.key)(e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <RadioQuestion
        label="Did you prepare for the sales meeting?"
        required
        name="preparedForSalesMeeting"
        options={YES_NO}
        value={preparedForSalesMeeting}
        onChange={setPreparedForSalesMeeting}
      />

      {preparedForSalesMeetingIsYes && (
        <FormField
          label="Please describe special points for today's discussion"
          required
        >
          <textarea
            rows="3"
            required
            value={preparedForSalesMeetingDescribe}
            onChange={(e) =>
              setPreparedForSalesMeetingDescribe(e.target.value)
            }
            className={inputClass}
          />
        </FormField>
      )}

      <RadioQuestion
        label="Have all team members arrived?"
        required
        name="allTeamMembersArrived"
        options={YES_NO}
        value={allTeamMembersArrived}
        onChange={setAllTeamMembersArrived}
      />

      <RadioQuestion
        label="Did you ask the sales team for the quote sheet at 5:00 PM?"
        required
        name="askedForQuoteSheet"
        options={YES_NO}
        value={askedForQuoteSheet}
        onChange={setAskedForQuoteSheet}
      />

      <RadioQuestion
        label="Did you assign work to the warehouse and cleaning personnel?"
        required
        name="assignedWork"
        options={YES_NO}
        value={assignedWork}
        onChange={(val) => {
          setAssignedWork(val)
          if (val !== 'Yes') setAssignedWorkDescribe('')
        }}
      />

      {assignedWork === 'Yes' && (
        <FormField label="Please describe" required>
          <textarea
            rows="3"
            required
            value={assignedWorkDescribe}
            onChange={(e) => setAssignedWorkDescribe(e.target.value)}
            className={inputClass}
          />
        </FormField>
      )}

      <FormField label="Comments">
        <textarea
          rows="3"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className={inputClass}
        />
      </FormField>
    </FormShell>
  )
}

export default ManagersOpeningChecklistForm
