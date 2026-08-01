import { Fragment, useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import RadioQuestion from '../../components/RadioQuestion.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { MAX_FILE_MB, MAX_FILE_SIZE } from '../../lib/limits.js'

const FORM_KEY = 'delivery-checklist'

const CHECK_QUESTIONS = [
  { key: 'pwr_check', label: 'PWR CHECK (VERIFICACIÓN DE ENERGÍA)' },
  { key: 'clean_check', label: 'CLEAN (LIMPIA)' },
  { key: 'functionality', label: 'FUNCTIONALITY (FUNCIONALIDAD)' },
  { key: 'damage', label: 'DAMAGE (DAÑO)' },
  {
    key: 'all_parts',
    label:
      'All parts including rails, slats and mirror runners (Todas las partes incluyendo rieles, listones y correderas del espejo)',
  },
  { key: 'pwr_supply', label: 'PWR SUPPLY (FUENTE DE ALIMENTACIÓN)' },
  { key: 'stains', label: 'STAINS (MANCHAS)' },
  {
    key: 'all_items_loaded',
    label:
      "Please confirm: all items for today's delivery have been loaded and nothing is left behind.",
  },
]

function DeliveryChecklist() {
  const { user } = useAuth()
  const [saleNumber, setSaleNumber] = useDraftState(`${FORM_KEY}.saleNumber`, '')
  const [checks, setChecks] = useDraftState(`${FORM_KEY}.checks`, {})
  const [checkedBy, setCheckedBy] = useDraftState(`${FORM_KEY}.checkedBy`, user?.name || '')
  const [readyForDelivery, setReadyForDelivery] = useDraftState(`${FORM_KEY}.readyForDelivery`, '')
  const [remarks, setRemarks] = useDraftState(`${FORM_KEY}.remarks`, '')
  // Conditional "DAMAGE = Yes" follow-ups.
  const [damageCustomerName, setDamageCustomerName] = useDraftState(
    `${FORM_KEY}.damageCustomerName`,
    ''
  )
  const [damageSalesNumber, setDamageSalesNumber] = useDraftState(
    `${FORM_KEY}.damageSalesNumber`,
    ''
  )
  // File attachments can't be persisted — Blobs aren't JSON-serializable and
  // browsers won't let JS re-attach a saved File to <input type=file>.
  const [attachment, setAttachment] = useState(null)
  const [fileError, setFileError] = useState('')
  const [damagePhoto, setDamagePhoto] = useState(null)
  const [damagePhotoError, setDamagePhotoError] = useState('')
  const [loadingAreaPhoto, setLoadingAreaPhoto] = useState(null)
  const [loadingAreaPhotoError, setLoadingAreaPhotoError] = useState('')
  const [allPartsPhoto, setAllPartsPhoto] = useState(null)
  const [allPartsPhotoError, setAllPartsPhotoError] = useState('')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const setCheck = (key) => (val) => {
    setChecks((p) => ({ ...p, [key]: val }))
    // If they switch the damage row away from Yes, drop the conditional data
    // so it doesn't get submitted alongside a contradictory answer.
    if (key === 'damage' && val !== 'Yes') {
      setDamageCustomerName('')
      setDamageSalesNumber('')
      setDamagePhoto(null)
      setDamagePhotoError('')
    }
    if (key === 'all_items_loaded' && val !== 'Yes') {
      setLoadingAreaPhoto(null)
      setLoadingAreaPhotoError('')
    }
    if (key === 'all_parts' && val !== 'Yes') {
      setAllPartsPhoto(null)
      setAllPartsPhotoError('')
    }
  }

  const damageIsYes = checks.damage === 'Yes'
  const allItemsLoadedIsYes = checks.all_items_loaded === 'Yes'
  const allPartsIsYes = checks.all_parts === 'Yes'

  const handleAllPartsPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setAllPartsPhoto(null)
      setAllPartsPhotoError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setAllPartsPhotoError(
        `"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`
      )
      return
    }
    setAllPartsPhotoError('')
    setAllPartsPhoto(file)
  }

  const handleLoadingAreaPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setLoadingAreaPhoto(null)
      setLoadingAreaPhotoError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setLoadingAreaPhotoError(
        `"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`
      )
      return
    }
    setLoadingAreaPhotoError('')
    setLoadingAreaPhoto(file)
  }

  const handleDamagePhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setDamagePhoto(null)
      setDamagePhotoError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setDamagePhotoError(`"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`)
      return
    }
    setDamagePhotoError('')
    setDamagePhoto(file)
  }

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
        sale_number: saleNumber,
        ...checks,
        checked_by: checkedBy,
        ready_for_delivery: readyForDelivery,
        remarks,
        damage_customer_name: damageIsYes ? damageCustomerName : '',
        damage_sales_number: damageIsYes ? damageSalesNumber : '',
      },
      files: {
        attachment,
        ...(damageIsYes ? { damage_photo: damagePhoto } : {}),
        ...(allItemsLoadedIsYes
          ? { loading_area_photo: loadingAreaPhoto }
          : {}),
        ...(allPartsIsYes
          ? { all_parts_photo: allPartsPhoto }
          : {}),
      },
    })
  }

  const handleReset = () => {
    setSaleNumber('')
    setChecks({})
    setCheckedBy(user?.name || '')
    setAttachment(null)
    setFileError('')
    setReadyForDelivery('')
    setRemarks('')
    setDamageCustomerName('')
    setDamageSalesNumber('')
    setDamagePhoto(null)
    setDamagePhotoError('')
    setLoadingAreaPhoto(null)
    setLoadingAreaPhotoError('')
    setAllPartsPhoto(null)
    setAllPartsPhotoError('')
    reset()
  }

  return (
    <FormShell
      title="DELIVERY CHECKLIST"
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

        <FormField label="SALE NUMBER (NÚMERO DE VENTA)" required>
          <input
            type="text"
            required
            value={saleNumber}
            onChange={(e) => setSaleNumber(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      {CHECK_QUESTIONS.map(({ key, label }) => (
        <Fragment key={key}>
          <RadioQuestion
            label={label}
            required
            horizontal
            name={key}
            options={['Yes', 'No']}
            value={checks[key]}
            onChange={setCheck(key)}
          />
          {key === 'all_parts' && allPartsIsYes && (
            <FormField
              label="Upload photo of all parts"
              required
              hint={`Max ${MAX_FILE_MB} MB.`}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                required
                onChange={handleAllPartsPhoto}
                className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
              />
              {allPartsPhotoError && (
                <p className="text-xs text-rose-600 mt-1.5">
                  {allPartsPhotoError}
                </p>
              )}
              {allPartsPhoto && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                  <span className="flex-1 truncate">
                    {allPartsPhoto.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {(allPartsPhoto.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </FormField>
          )}
          {key === 'all_items_loaded' && allItemsLoadedIsYes && (
            <FormField
              label="Upload photo of loading area"
              required
              hint={`Max ${MAX_FILE_MB} MB.`}
            >
              <input
                type="file"
                accept="image/*,.pdf"
                required
                onChange={handleLoadingAreaPhoto}
                className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
              />
              {loadingAreaPhotoError && (
                <p className="text-xs text-rose-600 mt-1.5">
                  {loadingAreaPhotoError}
                </p>
              )}
              {loadingAreaPhoto && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                  <span className="flex-1 truncate">
                    {loadingAreaPhoto.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {(loadingAreaPhoto.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              )}
            </FormField>
          )}
          {key === 'damage' && damageIsYes && (
            <>
              <FormField label="Customer name" required>
                <input
                  type="text"
                  required
                  value={damageCustomerName}
                  onChange={(e) => setDamageCustomerName(e.target.value)}
                  className={inputClass}
                />
              </FormField>

              <FormField label="Sales number" required>
                <input
                  type="text"
                  required
                  value={damageSalesNumber}
                  onChange={(e) => setDamageSalesNumber(e.target.value)}
                  className={inputClass}
                />
              </FormField>

              <FormField
                label="Upload damage photo"
                required
                hint={`Max ${MAX_FILE_MB} MB.`}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={handleDamagePhoto}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
                />
                {damagePhotoError && (
                  <p className="text-xs text-rose-600 mt-1.5">
                    {damagePhotoError}
                  </p>
                )}
                {damagePhoto && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                    <span className="flex-1 truncate">{damagePhoto.name}</span>
                    <span className="text-xs text-slate-500">
                      {(damagePhoto.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}
              </FormField>
            </>
          )}
        </Fragment>
      ))}

      <FormRow>
        <FormField label="CHECKED BY (REVISADO POR)" required>
          <input
            type="text"
            required
            value={checkedBy}
            onChange={(e) => setCheckedBy(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <RadioQuestion
          label="ITEM IS READY FOR DELIVERY"
          required
          horizontal
          name="readyForDelivery"
          options={['Yes', 'No']}
          value={readyForDelivery}
          onChange={setReadyForDelivery}
        />
      </FormRow>

      <FormField
        label="ATTACHMENT (ADJUNTO)"
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

      <FormField label="REMARKS (OBSERVACIONES)">
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

export default DeliveryChecklist
