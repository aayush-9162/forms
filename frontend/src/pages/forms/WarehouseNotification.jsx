import { useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import RadioQuestion from '../../components/RadioQuestion.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { todayIso } from '../../lib/dates.js'

const FORM_KEY = 'warehouse-notification'

const STATUS_OPTIONS = [
  'Customer Pickup',
  'Next Day Add-On',
  'Cancellation',
  'MTO Add-On',
  'Piece Missing At Store',
  'Contact Me',
  'OTHERS',
]

function WarehouseNotification() {
  const { user } = useAuth()
  // Date is intentionally not persisted — always today on each form open.
  const [date, setDate] = useState(todayIso)
  const [originator, setOriginator] = useDraftState(`${FORM_KEY}.originator`, '')
  const [customerName, setCustomerName] = useDraftState(`${FORM_KEY}.customerName`, '')
  const [saleNo, setSaleNo] = useDraftState(`${FORM_KEY}.saleNo`, '')
  const [status, setStatus] = useDraftState(`${FORM_KEY}.status`, '')
  const [assemblyRequired, setAssemblyRequired] = useDraftState(`${FORM_KEY}.assemblyRequired`, '')
  const [assemblyRemark, setAssemblyRemark] = useDraftState(`${FORM_KEY}.assemblyRemark`, '')
  const [comment, setComment] = useDraftState(`${FORM_KEY}.comment`, '')
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(FORM_KEY)

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        date,
        originator,
        customer_name: customerName,
        sale_no: saleNo,
        status,
        assembly_required: assemblyRequired,
        assembly_remark: assemblyRemark,
        comment,
      },
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setOriginator('')
    setCustomerName('')
    setSaleNo('')
    setStatus('')
    setAssemblyRequired('')
    setAssemblyRemark('')
    setComment('')
    reset()
  }

  return (
    <FormShell
      title="Warehouse Notification"
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

        <FormField label="DATE" required>
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
        <FormField label="ORIGINATOR">
          <input
            type="text"
            value={originator}
            onChange={(e) => setOriginator(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="CUSTOMER NAME">
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="SALE NO.">
          <input
            type="text"
            value={saleNo}
            onChange={(e) => setSaleNo(e.target.value)}
            className={inputClass}
          />
        </FormField>

        <FormField label="ASSEMBLY REMARK">
          <input
            type="text"
            value={assemblyRemark}
            onChange={(e) => setAssemblyRemark(e.target.value)}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <RadioQuestion
        label="Status"
        required
        name="status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
      />

      <RadioQuestion
        label="ASSEMBLY REQUIRED"
        name="assemblyRequired"
        options={['Yes', 'No']}
        value={assemblyRequired}
        onChange={setAssemblyRequired}
      />

      <FormField label="Comment (If Needed)">
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

export default WarehouseNotification
