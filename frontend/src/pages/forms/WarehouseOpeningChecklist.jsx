import { useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import RadioQuestion, { OTHER_VALUE } from '../../components/RadioQuestion.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { todayIso } from '../../lib/dates.js'
import { MAX_FILE_MB, MAX_FILE_SIZE } from '../../lib/limits.js'

const FORM_KEY = 'warehouse-opening-checklist'

function WarehouseOpeningChecklist() {
  const { user } = useAuth()
  // Date is intentionally not persisted — always today on each form open.
  const [date, setDate] = useState(todayIso)
  const [person, setPerson] = useDraftState(`${FORM_KEY}.person`, '')
  const [personOther, setPersonOther] = useDraftState(`${FORM_KEY}.personOther`, '')
  const [piecesInRoute, setPiecesInRoute] = useDraftState(`${FORM_KEY}.piecesInRoute`, '')
  const [stopsInRoute, setStopsInRoute] = useDraftState(`${FORM_KEY}.stopsInRoute`, '')
  const [trucksScheduled, setTrucksScheduled] = useDraftState(`${FORM_KEY}.trucksScheduled`, '')
  const [extNo, setExtNo] = useDraftState(`${FORM_KEY}.extNo`, '')
  const [answers, setAnswers] = useDraftState(`${FORM_KEY}.answers`, {})
  const [others, setOthers] = useDraftState(`${FORM_KEY}.others`, {})
  // Nested follow-up when "Today's Delivery Manifest checked" = Yes.
  const [manifestReportIssues, setManifestReportIssues] = useDraftState(
    `${FORM_KEY}.manifestReportIssues`,
    ''
  )
  const [manifestIssueDetails, setManifestIssueDetails] = useDraftState(
    `${FORM_KEY}.manifestIssueDetails`,
    ''
  )
  // Nested follow-up when "Confirmed Today's Deliveries have no COD's" = Yes.
  const [codsFileNo, setCodsFileNo] = useDraftState(
    `${FORM_KEY}.codsFileNo`,
    ''
  )
  // Nested follow-up when "DT/RV's Schedule … Match" = No.
  const [dtRvExplain, setDtRvExplain] = useDraftState(
    `${FORM_KEY}.dtRvExplain`,
    ''
  )
  // Previous-day route screenshot — Blobs can't be persisted via useDraftState.
  const [prevDayScreenshot, setPrevDayScreenshot] = useState(null)
  const [prevDayScreenshotError, setPrevDayScreenshotError] = useState('')
  // "How many?" follow-ups when the corresponding answer is Yes.
  const [returnItemsCount, setReturnItemsCount] = useDraftState(
    `${FORM_KEY}.returnItemsCount`,
    ''
  )
  const [emailVoiceMailCount, setEmailVoiceMailCount] = useDraftState(
    `${FORM_KEY}.emailVoiceMailCount`,
    ''
  )
  const [emailVoiceMailExplain, setEmailVoiceMailExplain] = useDraftState(
    `${FORM_KEY}.emailVoiceMailExplain`,
    ''
  )
  const [todayItemsCount, setTodayItemsCount] = useDraftState(
    `${FORM_KEY}.todayItemsCount`,
    ''
  )
  // CFC uniform Yes/No + conditional photo. Photo Blobs aren't persisted.
  const [teamWearingUniform, setTeamWearingUniform] = useDraftState(
    `${FORM_KEY}.teamWearingUniform`,
    ''
  )
  const [uniformPhoto, setUniformPhoto] = useState(null)
  const [uniformPhotoError, setUniformPhotoError] = useState('')
  // Truck-loading question: Yes → upload photo, No → explain why.
  const [truckLoadingMonitored, setTruckLoadingMonitored] = useDraftState(
    `${FORM_KEY}.truckLoadingMonitored`,
    ''
  )
  const [truckLoadingExplain, setTruckLoadingExplain] = useDraftState(
    `${FORM_KEY}.truckLoadingExplain`,
    ''
  )
  const [truckLoadingPhoto, setTruckLoadingPhoto] = useState(null)
  const [truckLoadingPhotoError, setTruckLoadingPhotoError] = useState('')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const setAnswer = (key) => (val) => {
    setAnswers((p) => ({ ...p, [key]: val }))
    // If they switch the manifest answer away from Yes, drop the nested
    // follow-up fields so we don't submit stale data.
    if (key === 'manifestChecked' && val !== 'Yes') {
      setManifestReportIssues('')
      setManifestIssueDetails('')
    }
    if (key === 'codsConfirmed' && val !== 'Yes') {
      setCodsFileNo('')
    }
    if (key === 'dtRvMatch' && val !== 'No') {
      setDtRvExplain('')
    }
    if (key === 'prevDayFinished' && val !== 'Yes') {
      setPrevDayScreenshot(null)
      setPrevDayScreenshotError('')
    }
    if (key === 'returnItemsReport' && val !== 'Yes') {
      setReturnItemsCount('')
    }
    if (key === 'emailVoiceMail' && val !== 'Yes') {
      setEmailVoiceMailCount('')
    }
    if (key === 'emailVoiceMail' && val !== 'No') {
      setEmailVoiceMailExplain('')
    }
    if (key === 'todayItemsConfirmed' && val !== 'Yes') {
      setTodayItemsCount('')
    }
  }

  const handlePrevDayFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setPrevDayScreenshot(null)
      setPrevDayScreenshotError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setPrevDayScreenshotError(
        `"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`
      )
      return
    }
    setPrevDayScreenshotError('')
    setPrevDayScreenshot(file)
  }

  const handleUniformPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setUniformPhoto(null)
      setUniformPhotoError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setUniformPhotoError(`"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`)
      return
    }
    setUniformPhotoError('')
    setUniformPhoto(file)
  }

  const handleTeamWearingUniformChange = (val) => {
    setTeamWearingUniform(val)
    if (val !== 'Yes') {
      setUniformPhoto(null)
      setUniformPhotoError('')
    }
  }

  const handleTruckLoadingMonitoredChange = (val) => {
    setTruckLoadingMonitored(val)
    if (val !== 'Yes') {
      setTruckLoadingPhoto(null)
      setTruckLoadingPhotoError('')
    }
    if (val !== 'No') {
      setTruckLoadingExplain('')
    }
  }

  const handleTruckLoadingPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setTruckLoadingPhoto(null)
      setTruckLoadingPhotoError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setTruckLoadingPhotoError(
        `"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`
      )
      return
    }
    setTruckLoadingPhotoError('')
    setTruckLoadingPhoto(file)
  }

  const truckLoadingIsYes = truckLoadingMonitored === 'Yes'
  const truckLoadingIsNo = truckLoadingMonitored === 'No'
  const setOther = (key) => (val) =>
    setOthers((p) => ({ ...p, [key]: val }))

  const handleManifestReportIssuesChange = (val) => {
    setManifestReportIssues(val)
    if (val !== 'Yes') setManifestIssueDetails('')
  }

  const manifestIsYes = answers.manifestChecked === 'Yes'
  const manifestHasIssues = manifestIsYes && manifestReportIssues === 'Yes'
  const codsIsYes = answers.codsConfirmed === 'Yes'
  const dtRvIsNo = answers.dtRvMatch === 'No'
  const prevDayIsYes = answers.prevDayFinished === 'Yes'
  const returnItemsIsYes = answers.returnItemsReport === 'Yes'
  const emailVoiceMailIsYes = answers.emailVoiceMail === 'Yes'
  const emailVoiceMailIsNo = answers.emailVoiceMail === 'No'
  const todayItemsIsYes = answers.todayItemsConfirmed === 'Yes'
  const teamWearingUniformIsYes = teamWearingUniform === 'Yes'

  const resolveAnswer = (key) =>
    answers[key] === OTHER_VALUE ? `Other: ${others[key] || ''}` : answers[key]

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        date,
        person: person === OTHER_VALUE ? personOther : person,
        pieces_in_route: piecesInRoute,
        stops_in_route: stopsInRoute,
        trucks_scheduled: trucksScheduled,
        manifest_checked: resolveAnswer('manifestChecked'),
        manifest_report_issues: manifestIsYes ? manifestReportIssues : '',
        manifest_issue_details: manifestHasIssues ? manifestIssueDetails : '',
        cods_confirmed: resolveAnswer('codsConfirmed'),
        cods_file_no: codsIsYes ? codsFileNo : '',
        dt_rv_match: resolveAnswer('dtRvMatch'),
        dt_rv_explain: dtRvIsNo ? dtRvExplain : '',
        dt_notifications: resolveAnswer('dtNotifications'),
        prev_day_finished: resolveAnswer('prevDayFinished'),
        return_items_report: resolveAnswer('returnItemsReport'),
        return_items_count: returnItemsIsYes ? returnItemsCount : '',
        email_voice_mail: resolveAnswer('emailVoiceMail'),
        email_voice_mail_count: emailVoiceMailIsYes ? emailVoiceMailCount : '',
        email_voice_mail_explain: emailVoiceMailIsNo ? emailVoiceMailExplain : '',
        today_items_confirmed: resolveAnswer('todayItemsConfirmed'),
        today_items_count: todayItemsIsYes ? todayItemsCount : '',
        next_day_confirmed: resolveAnswer('nextDayConfirmed'),
        team_wearing_uniform: teamWearingUniform,
        truck_loading_monitored: truckLoadingMonitored,
        truck_loading_explain: truckLoadingIsNo ? truckLoadingExplain : '',
        ext_no: extNo,
      },
      files: {
        ...(prevDayIsYes
          ? { prev_day_screenshot: prevDayScreenshot }
          : {}),
        ...(teamWearingUniformIsYes
          ? { uniform_photo: uniformPhoto }
          : {}),
        ...(truckLoadingIsYes
          ? { truck_loading_photo: truckLoadingPhoto }
          : {}),
      },
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setPerson('')
    setPersonOther('')
    setPiecesInRoute('')
    setStopsInRoute('')
    setTrucksScheduled('')
    setExtNo('')
    setAnswers({})
    setOthers({})
    setManifestReportIssues('')
    setManifestIssueDetails('')
    setCodsFileNo('')
    setDtRvExplain('')
    setPrevDayScreenshot(null)
    setPrevDayScreenshotError('')
    setReturnItemsCount('')
    setEmailVoiceMailCount('')
    setEmailVoiceMailExplain('')
    setTodayItemsCount('')
    setTeamWearingUniform('')
    setUniformPhoto(null)
    setUniformPhotoError('')
    setTruckLoadingMonitored('')
    setTruckLoadingExplain('')
    setTruckLoadingPhoto(null)
    setTruckLoadingPhotoError('')
    reset()
  }

  return (
    <FormShell
      title="Warehouse Opening Checklist"
      description="Check list pre-loading for daily route."
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

        <FormField label="Today's Date" required>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <RadioQuestion
        label="Person"
        required
        name="person"
        options={['Chris Metlab', 'Justin']}
        value={person}
        onChange={setPerson}
        allowOther
        otherValue={personOther}
        onOtherChange={setPersonOther}
      />

      <FormRow cols={3}>
        <FormField label="# Pieces In Route">
          <input
            type="number"
            value={piecesInRoute}
            onChange={(e) => setPiecesInRoute(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="# Stops In Route">
          <input
            type="number"
            value={stopsInRoute}
            onChange={(e) => setStopsInRoute(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="# Trucks Scheduled">
          <input
            type="number"
            value={trucksScheduled}
            onChange={(e) => setTrucksScheduled(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <RadioQuestion
        label="Today's Delivery Manifest checked"
        required
        name="manifestChecked"
        options={['Yes', 'No']}
        value={answers.manifestChecked}
        onChange={setAnswer('manifestChecked')}
      />

      {manifestIsYes && (
        <RadioQuestion
          label="Report any issues?"
          required
          name="manifestReportIssues"
          options={['Yes', 'No']}
          value={manifestReportIssues}
          onChange={handleManifestReportIssuesChange}
        />
      )}

      {manifestHasIssues && (
        <FormField label="Provide details" required>
          <textarea
            rows="3"
            required
            value={manifestIssueDetails}
            onChange={(e) => setManifestIssueDetails(e.target.value)}
            className={inputClass}
          />
        </FormField>
      )}

      <RadioQuestion
        label="Confirmed Today's Deliveries have no COD's"
        required
        name="codsConfirmed"
        options={['Yes', 'No']}
        value={answers.codsConfirmed}
        onChange={setAnswer('codsConfirmed')}
        allowOther
        otherValue={others.codsConfirmed}
        onOtherChange={setOther('codsConfirmed')}
      />

      {codsIsYes && (
        <FormField label="Explain File No." required>
          <input
            type="text"
            required
            value={codsFileNo}
            onChange={(e) => setCodsFileNo(e.target.value)}
            className={inputClass}
          />
        </FormField>
      )}

      <RadioQuestion
        label="DT/RV's Schedule For Today's Deliveries Match (Including number of items each stop)"
        required
        name="dtRvMatch"
        options={['Yes', 'No']}
        value={answers.dtRvMatch}
        onChange={setAnswer('dtRvMatch')}
        allowOther
        otherValue={others.dtRvMatch}
        onOtherChange={setOther('dtRvMatch')}
      />

      {dtRvIsNo && (
        <FormField label="Please explain" required>
          <textarea
            rows="3"
            required
            value={dtRvExplain}
            onChange={(e) => setDtRvExplain(e.target.value)}
            className={inputClass}
          />
        </FormField>
      )}

      <RadioQuestion
        label="All DT Notifications Confirmed For Today's Deliveries"
        required
        name="dtNotifications"
        options={['Yes', 'No']}
        value={answers.dtNotifications}
        onChange={setAnswer('dtNotifications')}
        allowOther
        otherValue={others.dtNotifications}
        onOtherChange={setOther('dtNotifications')}
      />

      <RadioQuestion
        label="Previous Day Route Shows All Stops Finished"
        required
        name="prevDayFinished"
        options={['Yes', 'No']}
        value={answers.prevDayFinished}
        onChange={setAnswer('prevDayFinished')}
        allowOther
        otherValue={others.prevDayFinished}
        onOtherChange={setOther('prevDayFinished')}
      />

      {prevDayIsYes && (
        <FormField
          label="Upload screenshot"
          required
          hint={`Max ${MAX_FILE_MB} MB.`}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            required
            onChange={handlePrevDayFile}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
          />
          {prevDayScreenshotError && (
            <p className="text-xs text-rose-600 mt-1.5">
              {prevDayScreenshotError}
            </p>
          )}
          {prevDayScreenshot && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
              <span className="flex-1 truncate">{prevDayScreenshot.name}</span>
              <span className="text-xs text-slate-500">
                {(prevDayScreenshot.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </FormField>
      )}

      <RadioQuestion
        label="Previous Day's Return Items Report Printed"
        required
        name="returnItemsReport"
        options={['Yes', 'No', 'None Returned']}
        value={answers.returnItemsReport}
        onChange={setAnswer('returnItemsReport')}
      />

      {returnItemsIsYes && (
        <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-slate-50/40 border border-slate-200 rounded-lg">
          <label className="text-sm font-semibold text-slate-700">
            How many?
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            type="number"
            min="0"
            required
            value={returnItemsCount}
            onChange={(e) => setReturnItemsCount(e.target.value)}
            className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-400 transition-all"
          />
        </div>
      )}

      <RadioQuestion
        label="Checked Email/Voice Mail"
        required
        name="emailVoiceMail"
        options={['Yes', 'No']}
        value={answers.emailVoiceMail}
        onChange={setAnswer('emailVoiceMail')}
      />

      {emailVoiceMailIsYes && (
        <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-slate-50/40 border border-slate-200 rounded-lg">
          <label className="text-sm font-semibold text-slate-700">
            How many?
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            type="number"
            min="0"
            required
            value={emailVoiceMailCount}
            onChange={(e) => setEmailVoiceMailCount(e.target.value)}
            className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-400 transition-all"
          />
        </div>
      )}

      {emailVoiceMailIsNo && (
        <FormField label="Explain why" required>
          <textarea
            rows="3"
            required
            value={emailVoiceMailExplain}
            onChange={(e) => setEmailVoiceMailExplain(e.target.value)}
            className={inputClass}
          />
        </FormField>
      )}

      <RadioQuestion
        label="Confirmed All Items For Today's Delivery Are In OT Or Included In Route For Pickup At Stores"
        required
        name="todayItemsConfirmed"
        options={['Yes', 'No']}
        value={answers.todayItemsConfirmed}
        onChange={setAnswer('todayItemsConfirmed')}
        allowOther
        otherValue={others.todayItemsConfirmed}
        onOtherChange={setOther('todayItemsConfirmed')}
      />

      {todayItemsIsYes && (
        <div className="mb-6 flex items-center justify-between gap-4 px-4 py-3 bg-slate-50/40 border border-slate-200 rounded-lg">
          <label className="text-sm font-semibold text-slate-700">
            How many?
            <span className="text-rose-500 ml-0.5">*</span>
          </label>
          <input
            type="number"
            min="0"
            required
            value={todayItemsCount}
            onChange={(e) => setTodayItemsCount(e.target.value)}
            className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-400 transition-all"
          />
        </div>
      )}

      <RadioQuestion
        label="Confirmed all pieces for next day delivery, including mattresses are on hand (not back ordered). If something is missing - contact GENERAL MANAGER immediately"
        required
        name="nextDayConfirmed"
        options={['Yes', 'No']}
        value={answers.nextDayConfirmed}
        onChange={setAnswer('nextDayConfirmed')}
        allowOther
        otherValue={others.nextDayConfirmed}
        onOtherChange={setOther('nextDayConfirmed')}
      />

      <RadioQuestion
        label="Did the team wear the CFC uniform?"
        required
        name="teamWearingUniform"
        options={['Yes', 'No']}
        value={teamWearingUniform}
        onChange={handleTeamWearingUniformChange}
      />

      {teamWearingUniformIsYes && (
        <FormField
          label="Upload team photo"
          required
          hint={`Max ${MAX_FILE_MB} MB.`}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            required
            onChange={handleUniformPhoto}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
          />
          {uniformPhotoError && (
            <p className="text-xs text-rose-600 mt-1.5">{uniformPhotoError}</p>
          )}
          {uniformPhoto && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
              <span className="flex-1 truncate">{uniformPhoto.name}</span>
              <span className="text-xs text-slate-500">
                {(uniformPhoto.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </FormField>
      )}

      <RadioQuestion
        label="Did you monitor the truck-loading process and confirm that all pieces were loaded on the truck?"
        required
        name="truckLoadingMonitored"
        options={['Yes', 'No']}
        value={truckLoadingMonitored}
        onChange={handleTruckLoadingMonitoredChange}
      />

      {truckLoadingIsYes && (
        <FormField
          label="Upload truck-loading photo"
          required
          hint={`Max ${MAX_FILE_MB} MB.`}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            required
            onChange={handleTruckLoadingPhoto}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
          />
          {truckLoadingPhotoError && (
            <p className="text-xs text-rose-600 mt-1.5">
              {truckLoadingPhotoError}
            </p>
          )}
          {truckLoadingPhoto && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
              <span className="flex-1 truncate">{truckLoadingPhoto.name}</span>
              <span className="text-xs text-slate-500">
                {(truckLoadingPhoto.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </FormField>
      )}

      {truckLoadingIsNo && (
        <FormField label="Explain why" required>
          <textarea
            rows="3"
            required
            value={truckLoadingExplain}
            onChange={(e) => setTruckLoadingExplain(e.target.value)}
            className={inputClass}
          />
        </FormField>
      )}

      <FormField label="EXT NO.">
        <input
          type="text"
          value={extNo}
          onChange={(e) => setExtNo(e.target.value)}
          className={inputClass}
        />
      </FormField>
    </FormShell>
  )
}

export default WarehouseOpeningChecklist
