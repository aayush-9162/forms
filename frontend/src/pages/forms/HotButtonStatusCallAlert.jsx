import { useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import RadioQuestion from '../../components/RadioQuestion.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { todayIso } from '../../lib/dates.js'

const FORM_KEY = 'hot-button-status-call-alert'

function HotButtonStatusCallAlert() {
  const { user } = useAuth()
  const [salesPersonName, setSalesPersonName] = useDraftState(`${FORM_KEY}.salesPersonName`, user?.name || '')
  const [concernType, setConcernType] = useDraftState(`${FORM_KEY}.concernType`, '')
  const [store, setStore] = useDraftState(`${FORM_KEY}.store`, '')
  const [customerName, setCustomerName] = useDraftState(`${FORM_KEY}.customerName`, '')
  const [saleNumber, setSaleNumber] = useDraftState(`${FORM_KEY}.saleNumber`, '')
  // Sale date is intentionally not persisted — always today on each form open.
  const [saleDate, setSaleDate] = useState(todayIso)
  const [description, setDescription] = useDraftState(`${FORM_KEY}.description`, '')
  const [stepsTaken, setStepsTaken] = useDraftState(`${FORM_KEY}.stepsTaken`, '')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        sales_person_name: salesPersonName,
        concern_type: concernType,
        store,
        customer_name: customerName,
        sale_number: saleNumber,
        sale_date: saleDate,
        description,
        steps_taken: stepsTaken,
      },
    })
  }

  const handleReset = () => {
    setSalesPersonName(user?.name || '')
    setConcernType('')
    setStore('')
    setCustomerName('')
    setSaleNumber('')
    setSaleDate(todayIso())
    setDescription('')
    setStepsTaken('')
    reset()
  }

  return (
    <FormShell
      title="HOT BUTTON / STATUS CALL ALERT"
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

        <FormField label="Sales Person Name" required>
          <input
            type="text"
            required
            value={salesPersonName}
            onChange={(e) => setSalesPersonName(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Concern Type" required>
          <input
            type="text"
            required
            value={concernType}
            onChange={(e) => setConcernType(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="Sale Date" required>
          <input
            type="date"
            required
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <RadioQuestion
        label="STORE"
        required
        name="store"
        options={['Arden', 'Waynesville']}
        value={store}
        onChange={setStore}
      />

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

        <FormField label="Sale Number" required>
          <input
            type="text"
            required
            value={saleNumber}
            onChange={(e) => setSaleNumber(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <FormField label="Description" required>
        <textarea
          rows="4"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </FormField>

      <FormField label="Steps Taken" required>
        <textarea
          rows="4"
          required
          value={stepsTaken}
          onChange={(e) => setStepsTaken(e.target.value)}
          className={inputClass}
        />
      </FormField>
    </FormShell>
  )
}

export default HotButtonStatusCallAlert
