import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { investigationsApi } from '../../services/api'
import { usePagination } from '../../hooks/useFetch'
import { LoadingPage, EmptyState, Pagination } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import { statusColor } from '../../utils/helpers'

const priorityBadge = (p) => {
  const map = { low: 'text-green-700 bg-green-50', medium: 'text-yellow-700 bg-yellow-50', high: 'text-orange-700 bg-orange-50', critical: 'text-red-700 bg-red-50' }
  return map[p] || 'text-slate-600 bg-slate-50'
}

export default function InvestigationsPage() {
  const [filters, setFilters] = useState({ status: '', priority: '' })

  const { data: investigations, meta, loading, updateParams, goToPage } = usePagination(
    (params) => investigationsApi.list(params)
  )

  const applyFilter = (key, val) => {
    const updated = { ...filters, [key]: val }
    setFilters(updated)
    updateParams(updated)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">Filter:</span>
          </div>
          <select className="input text-sm w-40"
            value={filters.status}
            onChange={e => applyFilter('status', e.target.value)}>
            <option value="">All Status</option>
            {['open', 'in_progress', 'resolved', 'escalated', 'closed'].map(s =>
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            )}
          </select>
          <select className="input text-sm w-40"
            value={filters.priority}
            onChange={e => applyFilter('priority', e.target.value)}>
            <option value="">All Priority</option>
            {['low', 'medium', 'high', 'critical'].map(p =>
              <option key={p} value={p}>{p}</option>
            )}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? <LoadingPage /> : investigations?.length === 0 ? (
          <EmptyState icon={Search} title="No investigations found" description="Investigations are created from flagged transactions" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Case #', 'Title', 'Investigator', 'Priority', 'Status', 'Created', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {investigations.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-blue-600 font-bold">{inv.case_number}</span>
                    </td>
                    <td className="py-3 px-4 max-w-[250px]">
                      <p className="font-medium text-slate-800 truncate">{inv.title}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{inv.investigator_name || 'Unassigned'}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${priorityBadge(inv.priority)}`}>
                        {inv.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusColor(inv.status)}`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs">{formatDate(inv.created_at)}</td>
                    <td className="py-3 px-4">
                      <Link to={`/investigations/${inv.id}`} className="text-blue-600 hover:underline text-xs">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta && (
          <div className="px-4 py-3 border-t border-slate-100">
            <Pagination meta={meta} onPageChange={goToPage} />
          </div>
        )}
      </div>
    </div>
  )
}
