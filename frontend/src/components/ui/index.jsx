export function Spinner({ size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size]
  return (
    <div className={`${sz} border-2 border-blue-600 border-t-transparent rounded-full animate-spin`} />
  )
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon size={48} className="text-slate-300 mb-4" />}
      <h3 className="font-semibold text-slate-600 text-lg">{title}</h3>
      {description && <p className="text-slate-400 text-sm mt-1 max-w-xs">{description}</p>}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-red-500 text-xl font-bold">!</span>
      </div>
      <p className="text-slate-600 font-medium">{message || 'Something went wrong'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary mt-4 text-sm">
          Try Again
        </button>
      )}
    </div>
  )
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  )
}

export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.pages <= 1) return null
  return (
    <div className="flex items-center justify-between text-sm text-slate-500 mt-4">
      <span>Showing page {meta.current_page} of {meta.pages} ({meta.total} total)</span>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page <= 1}
          className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          Prev
        </button>
        {[...Array(Math.min(meta.pages, 5))].map((_, i) => {
          const page = i + 1
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded border ${
                page === meta.current_page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          )
        })}
        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page >= meta.pages}
          className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export function RiskBadge({ level }) {
  const classes = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low'
  }
  return <span className={classes[level] || 'badge-low'}>{level?.toUpperCase()}</span>
}

export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-xl shadow-xl w-full ${widths[size]} max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-slate-200">
            <h2 className="font-semibold text-slate-800 text-lg">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
