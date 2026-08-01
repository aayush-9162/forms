import { useMemo, useState } from 'react'
import FormField, { inputClass } from '../../components/FormField.jsx'
import FormRow from '../../components/FormRow.jsx'
import FormShell from '../../components/FormShell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSubmitForm } from '../../hooks/useSubmitForm.js'
import { useDraftState } from '../../hooks/useDraftState.js'
import { todayIso } from '../../lib/dates.js'

const baseState = {
  openingCash: '200',
  totalCashReceived: '',
  totalCheckReceived: '',
  extNo: '',
  remarks: '',
}

function CashReceivedForm({ title, formKey }) {
  const { user } = useAuth()
  // Date is intentionally NOT persisted — always reflects today on each
  // form open, even on refresh. All other fields stick around as drafts.
  const [date, setDate] = useState(todayIso)
  const [values, setValues] = useDraftState(`${formKey}.values`, baseState)
  const { submit, submitting, submitted, queued, error, reset } =
    useSubmitForm(formKey)

  const closingBalance = useMemo(() => {
    const opening = parseFloat(values.openingCash) || 0
    const cashReceived = parseFloat(values.totalCashReceived) || 0
    return opening + cashReceived
  }, [values.openingCash, values.totalCashReceived])

  const total = useMemo(() => {
    const cash = parseFloat(values.totalCashReceived) || 0
    const check = parseFloat(values.totalCheckReceived) || 0
    return cash + check
  }, [values.totalCashReceived, values.totalCheckReceived])

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    submit({
      fields: {
        date,
        opening_cash: values.openingCash,
        total_cash_received: values.totalCashReceived,
        total_check_received: values.totalCheckReceived,
        total: total.toFixed(2),
        closing_balance: closingBalance.toFixed(2),
        ext_no: values.extNo,
        remarks: values.remarks,
      },
    })
  }

  const handleReset = () => {
    setDate(todayIso())
    setValues(baseState)
    reset()
  }

  const computedClass = `${inputClass} bg-indigo-50/40 border-indigo-200 cursor-not-allowed font-semibold text-slate-900`

  return (
    <FormShell
      title={title}
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
        <FormField label="Opening Cash">
          <input
            type="number"
            step="0.01"
            value={values.openingCash}
            onChange={handleChange('openingCash')}
            className={inputClass}
          />
        </FormField>

        <FormField label="Total Cash Received" required>
          <input
            type="number"
            step="0.01"
            required
            value={values.totalCashReceived}
            onChange={handleChange('totalCashReceived')}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Total Check Received" required>
          <input
            type="number"
            step="0.01"
            required
            value={values.totalCheckReceived}
            onChange={handleChange('totalCheckReceived')}
            className={inputClass}
          />
        </FormField>

        <FormField
          label="Closing Balance in Till"
          required
          hint="Auto-calculated: Opening Cash + Total Cash Received."
        >
          <input
            type="number"
            readOnly
            value={closingBalance.toFixed(2)}
            className={computedClass}
          />
        </FormField>
      </FormRow>

      <FormRow>
        <FormField
          label="Total (CASH + CHECK RECEIVED)"
          required
          hint="Auto-calculated from cash and check received."
        >
          <input
            type="number"
            readOnly
            value={total.toFixed(2)}
            className={computedClass}
          />
        </FormField>

        <FormField label="EXT NO">
          <input
            type="text"
            value={values.extNo}
            onChange={handleChange('extNo')}
            className={inputClass}
          />
        </FormField>
      </FormRow>

      <FormField label="Remarks">
        <textarea
          rows="3"
          value={values.remarks}
          onChange={handleChange('remarks')}
          className={inputClass}
        />
      </FormField>
    </FormShell>
  )
}

export default CashReceivedForm
