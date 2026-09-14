import { useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import RadioQuestion from '../../components/RadioQuestion.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { MAX_FILE_MB, MAX_FILE_SIZE } from '../../lib/limits.js'
import { todayIso } from '../../lib/dates.js'

const FORM_KEY = 'pre-delivery-checklist'

const CLEAN_OPTIONS = ['Clean', 'Free from Dirt', 'Smudges']

function PreDeliveryChecklist() {
  const { user } = useAuth()
  // Date is intentionally not persisted — always today on each form open.
  const [date, setDate] = useState(todayIso)
  const [itemsReady, setItemsReady] = useDraftState(`${FORM_KEY}.itemsReady`, '')
  const [itemsReadyExceptions, setItemsReadyExceptions] = useDraftState(`${FORM_KEY}.itemsReadyExceptions`, '')
  const [cleanStatus, setCleanStatus] = useDraftState(`${FORM_KEY}.cleanStatus`, [])
  const [cleanExceptions, setCleanExceptions] = useDraftState(`${FORM_KEY}.cleanExceptions`, '')
  const [accessoriesAvailable, setAccessoriesAvailable] = useDraftState(`${FORM_KEY}.accessoriesAvailable`, '')
  const [ifNoExplain, setIfNoExplain] = useDraftState(`${FORM_KEY}.ifNoExplain`, '')
  const [accessoriesExceptions, setAccessoriesExceptions] = useDraftState(`${FORM_KEY}.accessoriesExceptions`, '')
  const [damages, setDamages] = useDraftState(`${FORM_KEY}.damages`, '')
  const [deliveryManager, setDeliveryManager] = useDraftState(`${FORM_KEY}.deliveryManager`, '')
  const [warehouseManager, setWarehouseManager] = useDraftState(`${FORM_KEY}.warehouseManager`, '')
  // Power supply Yes/No + follow-up status.
  const [powerSupplyOnItem, setPowerSupplyOnItem] = useDraftState(
    `${FORM_KEY}.powerSupplyOnItem`,
    ''
  )
  const [powerSupplyStatus, setPowerSupplyStatus] = useDraftState(
    `${FORM_KEY}.powerSupplyStatus`,
    ''
  )
  // Bed/rails nested questions + photo when rails/slats = Yes.
  const [bedOnTruck, setBedOnTruck] = useDraftState(
    `${FORM_KEY}.bedOnTruck`,
    ''
  )
  const [railsSlatsChecked, setRailsSlatsChecked] = useDraftState(
    `${FORM_KEY}.railsSlatsChecked`,
    ''
  )
  // File uploads can't be persisted — Blobs aren't JSON-serializable.
  const [exceptionPics, setExceptionPics] = useState([])
  const [exceptionError, setExceptionError] = useState('')
  const MAX_EXCEPTION_PICS = 10
  const [railsSlatsImage, setRailsSlatsImage] = useState(null)
  const [railsSlatsImageError, setRailsSlatsImageError] = useState('')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const toggleCleanOption = (opt) => {
    setCleanStatus((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    )
  }

  const handleAccessoriesAvailableChange = (val) => {
    setAccessoriesAvailable(val)
    // Clear the "Explain" textarea if they flip away from No.
    if (val !== 'No') setIfNoExplain('')
  }

  const handlePowerSupplyChange = (val) => {
    setPowerSupplyOnItem(val)
    if (val !== 'Yes') setPowerSupplyStatus('')
  }

  const handleBedOnTruckChange = (val) => {
    setBedOnTruck(val)
    // Cascade the dependent questions when the parent flips away from Yes.
    if (val !== 'Yes') {
      setRailsSlatsChecked('')
      setRailsSlatsImage(null)
      setRailsSlatsImageError('')
    }
  }

  const handleRailsSlatsChange = (val) => {
    setRailsSlatsChecked(val)
    if (val !== 'Yes') {
      setRailsSlatsImage(null)
      setRailsSlatsImageError('')
    }
  }

  const handleRailsSlatsImage = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setRailsSlatsImage(null)
      setRailsSlatsImageError('')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setRailsSlatsImageError(
        `"${file.name}" exceeds the ${MAX_FILE_MB} MB limit.`
      )
      return
    }
    setRailsSlatsImageError('')
    setRailsSlatsImage(file)
  }

  const powerSupplyIsYes = powerSupplyOnItem === 'Yes'
  const bedOnTruckIsYes = bedOnTruck === 'Yes'
  const railsSlatsIsYes = bedOnTruckIsYes && railsSlatsChecked === 'Yes'

  const handleExceptionPics = (e) => {
    const incoming = Array.from(e.target.files || [])
    // Reset so re-picking the same file (or re-opening) still fires.
    e.target.value = ''
    if (!incoming.length) return
    const tooBig = incoming.find((f) => f.size > MAX_FILE_SIZE)
    if (tooBig) {
      setExceptionError(`"${tooBig.name}" exceeds the ${MAX_FILE_MB} MB limit.`)
      return
    }
    // Append to the existing selection, skipping duplicates (name + size).
    const seen = new Set(exceptionPics.map((f) => `${f.name}:${f.size}`))
    const merged = [...exceptionPics]
    for (const f of incoming) {
      const key = `${f.name}:${f.size}`
      if (!seen.has(key)) {
        seen.add(key)
        merged.push(f)
      }
    }
    if (merged.length > MAX_EXCEPTION_PICS) {
      setExceptionPics(merged.slice(0, MAX_EXCEPTION_PICS))
      setExceptionError(`You can attach up to ${MAX_EXCEPTION_PICS} files.`)
    } else {
      setExceptionPics(merged)
      setExceptionError('')
    }
  }

  const removeExceptionPic = (idx) => {
    setExceptionPics((prev) => prev.filter((_, i) => i !== idx))
    setExceptionError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        date,
        items_ready: itemsReady,
        items_ready_exceptions: itemsReadyExceptions,
        clean_status: cleanStatus,
        clean_exceptions: cleanExceptions,
        accessories_available: accessoriesAvailable,
        if_no_explain: ifNoExplain,
        accessories_exceptions: accessoriesExceptions,
        damages,
        delivery_manager: deliveryManager,
        warehouse_manager: warehouseManager,
        power_supply_on_item: powerSupplyOnItem,
        power_supply_status: powerSupplyIsYes ? powerSupplyStatus : '',
        bed_on_truck: bedOnTruck,
        rails_slats_checked: bedOnTruckIsYes ? railsSlatsChecked : '',
      },
      files: {
        exception_pics: exceptionPics,
        ...(railsSlatsIsYes
          ? { rails_slats_image: railsSlatsImage }
          : {}),
      },
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setItemsReady('')
    setItemsReadyExceptions('')
    setCleanStatus([])
    setCleanExceptions('')
    setAccessoriesAvailable('')
    setIfNoExplain('')
    setAccessoriesExceptions('')
    setDamages('')
    setExceptionPics([])
    setExceptionError('')
    setDeliveryManager('')
    setWarehouseManager('')
    setPowerSupplyOnItem('')
    setPowerSupplyStatus('')
    setBedOnTruck('')
    setRailsSlatsChecked('')
    setRailsSlatsImage(null)
    setRailsSlatsImageError('')
    reset()
  }

  const exceptionPicker = (
    <FormField
      label="Pictures of Exceptions"
      hint={`Upload up to ${MAX_EXCEPTION_PICS} supported files. Max ${MAX_FILE_MB} MB per file.`}
    >
      <input
        type="file"
        multiple
        accept="image/*,.pdf"
        onChange={handleExceptionPics}
        className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
      />
      {exceptionError && (
        <p className="text-xs text-rose-600 mt-1.5">{exceptionError}</p>
      )}
      {exceptionPics.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-xs text-slate-500">
            {exceptionPics.length} of {MAX_EXCEPTION_PICS} file
            {exceptionPics.length === 1 ? '' : 's'} selected
          </div>
          {exceptionPics.map((f, i) => (
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
                onClick={() => removeExceptionPic(i)}
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
  )

  return (
    <FormShell
      title="Pre-Delivery Checklist"
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

      <RadioQuestion
        label="Are all items scheduled for delivery today ready to be loaded?"
        required
        name="itemsReady"
        options={['Yes', 'No']}
        value={itemsReady}
        onChange={setItemsReady}
      />

      <FormField label="Describe any exceptions" required>
        <textarea
          rows="3"
          required
          value={itemsReadyExceptions}
          onChange={(e) => setItemsReadyExceptions(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Are all items to be delivered clean and free of any dirt or smudges?
          <span className="text-rose-500 ml-0.5">*</span>
        </label>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {CLEAN_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors py-1"
            >
              <input
                type="checkbox"
                checked={cleanStatus.includes(opt)}
                onChange={() => toggleCleanOption(opt)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer rounded"
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      </div>

      <FormField label="Describe any exceptions" required>
        <textarea
          rows="3"
          required
          value={cleanExceptions}
          onChange={(e) => setCleanExceptions(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <RadioQuestion
        label="Are all accessories necessary for installation available?"
        required
        name="accessoriesAvailable"
        options={['Yes', 'No']}
        value={accessoriesAvailable}
        onChange={handleAccessoriesAvailableChange}
      />

      {accessoriesAvailable === 'No' && (
        <FormField label="Explain" required>
          <textarea
            rows="3"
            required
            value={ifNoExplain}
            onChange={(e) => setIfNoExplain(e.target.value)}
            className={inputClass}
          />
        </FormField>
      )}

      <FormField label="Describe any exceptions">
        <input
          type="text"
          value={accessoriesExceptions}
          onChange={(e) => setAccessoriesExceptions(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="Note any damages to items to be delivered below" required>
        <textarea
          rows="3"
          required
          value={damages}
          onChange={(e) => setDamages(e.target.value)}
          className={inputClass}
        />
      </FormField>

      {exceptionPicker}

      <RadioQuestion
        label="Is there any power supply on item?"
        required
        name="powerSupplyOnItem"
        options={['Yes', 'No']}
        value={powerSupplyOnItem}
        onChange={handlePowerSupplyChange}
      />

      {powerSupplyIsYes && (
        <RadioQuestion
          label="Verify power supply taken"
          required
          name="powerSupplyStatus"
          options={['Yes', 'No']}
          value={powerSupplyStatus}
          onChange={setPowerSupplyStatus}
        />
      )}

      <RadioQuestion
        label="Bed on truck?"
        required
        name="bedOnTruck"
        options={['Yes', 'No']}
        value={bedOnTruck}
        onChange={handleBedOnTruckChange}
      />

      {bedOnTruckIsYes && (
        <RadioQuestion
          label="Check rails / slats?"
          required
          name="railsSlatsChecked"
          options={['Yes', 'No']}
          value={railsSlatsChecked}
          onChange={handleRailsSlatsChange}
        />
      )}

      {railsSlatsIsYes && (
        <FormField
          label="Upload rails / slats picture"
          required
          hint={`Max ${MAX_FILE_MB} MB.`}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            required
            onChange={handleRailsSlatsImage}
            className="block w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-indigo-50 file:to-violet-50 file:text-indigo-700 hover:file:from-indigo-100 hover:file:to-violet-100 cursor-pointer"
          />
          {railsSlatsImageError && (
            <p className="text-xs text-rose-600 mt-1.5">
              {railsSlatsImageError}
            </p>
          )}
          {railsSlatsImage && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
              <span className="flex-1 truncate">{railsSlatsImage.name}</span>
              <span className="text-xs text-slate-500">
                {(railsSlatsImage.size / 1024).toFixed(1)} KB
              </span>
            </div>
          )}
        </FormField>
      )}

      <FormRow>
        <FormField label="Delivery Team Manager Name" required>
          <input
            type="text"
            required
            value={deliveryManager}
            onChange={(e) => setDeliveryManager(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="Warehouse Manager Name" required>
          <input
            type="text"
            required
            value={warehouseManager}
            onChange={(e) => setWarehouseManager(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>
    </FormShell>
  )
}

export default PreDeliveryChecklist
