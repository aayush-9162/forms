// Today's date in YYYY-MM-DD using the user's LOCAL timezone — the format
// the HTML <input type="date"> expects. Doing this by hand avoids the
// classic UTC trap where `new Date().toISOString().slice(0,10)` returns the
// wrong day for users west of UTC late in the evening.
export function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
