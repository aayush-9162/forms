export function formatValue(value, type) {
  if (value === null || value === undefined || value === '') return '—'

  switch (type) {
    case 'money':
      return formatMoney(value)
    case 'int':
      return Number(value).toLocaleString('en-US')
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
  const s = String(v)
  // A calendar date carries no time zone. JS parses 'YYYY-MM-DD' as UTC
  // midnight, which renders as the PREVIOUS day in zones behind UTC (e.g. US
  // Eastern), so build the date from its parts as a local date instead. This
  // matches the leading date of both '2026-09-11' and '2026-09-11 18:50:00'.
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(v)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(v) {
  if (!v) return '—'
  try {
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return String(v)
    return d.toLocaleString('en-US', {
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
