function FormShell({
  title,
  description,
  notShared,
  submitted,
  queued,
  submitting,
  error,
  onSubmit,
  onReset,
  children,
}) {
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/70 p-10 text-center overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-emerald-500 before:to-teal-500 before:content-['']">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-5 mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Response recorded
          </h2>
          <p className="text-slate-600 mb-6">
            Your {title} submission has been saved.
          </p>
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            Submit another response
          </button>
        </div>
      </div>
    )
  }

  if (queued) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/70 p-10 text-center overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-amber-500 before:to-orange-500 before:content-['']">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-5 mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
            Saved locally
          </h2>
          <p className="text-slate-600 mb-2 max-w-md mx-auto">
            We couldn&apos;t reach the server right now, so your {title}{' '}
            response is safely stored on this device.
          </p>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            It will be submitted automatically as soon as the connection is
            back. You can safely close this page.
          </p>
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
          >
            Submit another response
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200/70 p-8 pt-10 mb-5 overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-1.5 before:bg-gradient-to-r before:from-indigo-500 before:via-violet-500 before:to-fuchsia-500 before:content-['']">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-slate-600 mb-3 leading-relaxed">{description}</p>
        )}
        {notShared && (
          <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
            Not shared
          </span>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl shadow-sm border border-slate-200/70 p-6 sm:p-8"
      >
        {children}

        {error && (
          <div className="mt-2 mb-4 flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mt-0.5 shrink-0 text-rose-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 mt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 font-semibold shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-md flex items-center gap-2"
          >
            {submitting && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={submitting}
            className="text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors disabled:opacity-50"
          >
            Clear form
          </button>
        </div>
      </form>
    </div>
  )
}

export default FormShell
