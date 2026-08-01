export function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '—'

  switch (type) {
    case 'money':
      return formatMoney(value)
    case 'int':
      return Number(value).toLocaleString()
    case 'date':
      return formatDate(value)
    case 'datetime':
      return formatDateTime(value)
    case 'time':
      return String(value)
    case 'bool':
      return value === 1 || value === true || value === '1' ? 'Yes' : 'No'
    case 'textarea':
      return String(value).length > 80
        ? String(value).slice(0, 80) + '…'
        : String(value)
    default:
      return String(value)
  }
}

export function formatMoney(v) {
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return `$${n.toFixed(2)}`
}

export function formatDate(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return String(v)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return String(v)
  }
}

export function formatDateTime(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return String(v)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(v)
  }
}

export function parseJson(v) {
  if (!v) return null
  if (typeof v === 'object') return v
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}
