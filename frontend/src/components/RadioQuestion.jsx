const OTHER_VALUE = '__other__'

function RadioQuestion({
  label,
  required,
  options,
  value,
  onChange,
  name,
  allowOther,
  otherValue,
  onOtherChange,
  horizontal,
}) {
  if (horizontal) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <div className="flex flex-wrap gap-x-6 gap-y-3 bg-slate-50/50 border border-slate-200 rounded-lg p-4">
          {options.map((opt) => (
            <label
              key={opt}
              className="flex flex-col items-center gap-1.5 text-sm text-slate-700 cursor-pointer min-w-[2rem] hover:text-indigo-600 transition-colors"
            >
              <span className="font-medium">{opt}</span>
              <input
                type="radio"
                name={name}
                value={opt}
                checked={value === opt}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-indigo-600 transition-colors py-1"
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>{opt}</span>
          </label>
        ))}
        {allowOther && (
          <label className="flex items-center gap-2.5 text-sm text-slate-700 py-1">
            <input
              type="radio"
              name={name}
              value={OTHER_VALUE}
              checked={value === OTHER_VALUE}
              onChange={(e) => onChange(e.target.value)}
              required={required}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Other:</span>
            <input
              type="text"
              value={otherValue || ''}
              onChange={(e) => {
                onOtherChange(e.target.value)
                if (value !== OTHER_VALUE) onChange(OTHER_VALUE)
              }}
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </label>
        )}
      </div>
    </div>
  )
}

export { OTHER_VALUE }
export default RadioQuestion
