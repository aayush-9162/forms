function GridQuestion({ label, required, rows, columns, values, onChange, hint }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-500 mb-2 italic">{hint}</p>}
      <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-slate-50 to-indigo-50/40 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-700 w-2/5"></th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-3 font-semibold text-slate-700 text-center text-xs uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr
                key={row}
                className="hover:bg-indigo-50/30 transition-colors"
              >
                <td className="px-4 py-3 text-slate-800">{row}</td>
                {columns.map((col) => (
                  <td key={col} className="px-3 py-3 text-center">
                    <input
                      type="radio"
                      name={`${label}-${row}`}
                      value={col}
                      checked={values[row] === col}
                      onChange={() => onChange(row, col)}
                      required={required}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default GridQuestion
