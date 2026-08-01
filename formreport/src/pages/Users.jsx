import { useEffect, useMemo, useState } from 'react'
import { fetchUsers, saveUsers } from '../api.js'

// Roles offered in the dropdown. Edit this list to change the options.
const ROLES = ['admin', 'manager', 'salesperson', 'viewer']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent'

function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)

  const [form, setForm] = useState({ name: '', email: '', role: ROLES[0] })
  const [formError, setFormError] = useState('')

  const [editIndex, setEditIndex] = useState(-1)
  const [draft, setDraft] = useState({ name: '', email: '', role: '' })

  useEffect(() => {
    let alive = true
    fetchUsers()
      .then((data) => {
        if (alive) {
          setUsers(Array.isArray(data.users) ? data.users : [])
          setLoading(false)
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e.message || 'Could not load users')
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [])

  const emails = useMemo(
    () => new Set(users.map((u) => u.email.toLowerCase())),
    [users]
  )

  function addUser() {
    const email = form.email.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) return setFormError('Enter a valid email address.')
    if (emails.has(email)) return setFormError('That email is already in the list.')
    setUsers([...users, { email, name: form.name.trim(), role: form.role }])
    setForm({ name: '', email: '', role: ROLES[0] })
    setFormError('')
    setDirty(true)
  }

  function removeUser(i) {
    setUsers(users.filter((_, idx) => idx !== i))
    if (editIndex === i) setEditIndex(-1)
    setDirty(true)
  }

  function startEdit(i) {
    setEditIndex(i)
    setDraft({ ...users[i] })
  }

  function saveEdit() {
    const email = draft.email.trim().toLowerCase()
    if (!EMAIL_RE.test(email)) return
    if (users.some((u, idx) => idx !== editIndex && u.email.toLowerCase() === email))
      return
    const next = users.slice()
    next[editIndex] = { email, name: draft.name.trim(), role: draft.role }
    setUsers(next)
    setEditIndex(-1)
    setDirty(true)
  }

  async function persist() {
    setSaving(true)
    setError('')
    try {
      const data = await saveUsers(users)
      setUsers(Array.isArray(data.users) ? data.users : [])
      setDirty(false)
      setSavedAt(new Date())
    } catch (e) {
      setError(e.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-sm text-slate-500">
            {users.length} {users.length === 1 ? 'user' : 'users'} · saved to the
            server as JSON
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty ? (
            <span className="text-xs font-medium text-amber-600">
              Unsaved changes
            </span>
          ) : savedAt ? (
            <span className="text-xs font-medium text-emerald-600">Saved</span>
          ) : null}
          <button
            onClick={persist}
            disabled={!dirty || saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Add user */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto_auto] gap-2 items-start">
          <input
            className={inputClass}
            placeholder="Name (optional)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder="email@123cfc.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addUser()}
          />
          <select
            className={inputClass}
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={addUser}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Add
          </button>
        </div>
        {formError && (
          <p className="text-xs text-rose-600 mt-2">{formError}</p>
        )}
      </div>

      {/* User list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No users yet. Add one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-100">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u, i) =>
                editIndex === i ? (
                  <tr key={i} className="bg-indigo-50/40">
                    <td className="px-4 py-2">
                      <input
                        className={inputClass}
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        className={inputClass}
                        value={draft.email}
                        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className={inputClass}
                        value={draft.role}
                        onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                      >
                        {[...new Set([draft.role, ...ROLES])]
                          .filter(Boolean)
                          .map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={saveEdit}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold mr-3"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => setEditIndex(-1)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-700">{u.name || '—'}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                        {u.role || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => startEdit(i)}
                        className="text-slate-600 hover:text-indigo-600 font-medium mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeUser(i)}
                        className="text-slate-400 hover:text-rose-600 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-3">
        Changes are held locally until you press <strong>Save changes</strong>,
        which writes the full list to the server.
      </p>
    </div>
  )
}

export default Users
