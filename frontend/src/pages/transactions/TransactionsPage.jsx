import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, CreditCard, ChevronDown, X } from 'lucide-react'
import { transactionsApi } from '../../services/api'
import { usePagination } from '../../hooks/useFetch'
import { useDebounce } from '../../hooks/useDebounce'
import { LoadingPage, EmptyState, Pagination, RiskBadge } from '../../components/ui'
import { formatCurrency, formatDate } from '../../utils/helpers'

const FILTER_DEFAULTS = { risk_level: '', is_fraud: '', channel: '', status: '' }

export default function TransactionsPage() {
  const [search, setSearch]       = useState('')
  const [filters, setFilters]     = useState(FILTER_DEFAULTS)
  const [showFilters, setShowFilters] = useState(false)

  const debouncedSearch = useDebounce(search, 450)

  const { data: transactions, meta, loading, updateParams, goToPage } =
    usePagination((params) => transactionsApi.list(params))

  // Auto-search as user types (debounced)
  useEffect(() => {
    updateParams({ search: debouncedSearch })
  }, [debouncedSearch])

  const applyFilter = (key, val) => {
    const updated = { ...filters, [key]: val }
    setFilters(updated)
    updateParams(updated)
  }

  const clearAll = () => {
    setSearch('')
    setFilters(FILTER_DEFAULTS)
    updateParams({ search: '', ...FILTER_DEFAULTS })
  }

  const hasActiveFilters = search || Object.values(filters).some(Boolean)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Live search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9 pr-8"
              placeholder="Search ID, account, customer, merchant..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`btn-secondary flex items-center gap-2 ${showFilters ? 'ring-2 ring-blue-200' : ''}`}
            >
              <Filter size={15} />
              Filters
              {hasActiveFilters && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
              <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {hasActiveFilters && (
              <button onClick={clearAll} className="btn-secondary text-sm text-red-500 hover:text-red-600">
                Clear
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Risk Level</label>
              <select className="input text-sm" value={filters.risk_level}
                onChange={e => applyFilter('risk_level', e.target.value)}>
                <option value="">All</option>
                {['low', 'medium', 'high', 'critical'].map(v =>
                  <option key={v} value={v}>{v}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Fraud Status</label>
              <select className="input text-sm" value={filters.is_fraud}
                onChange={e => applyFilter('is_fraud', e.target.value)}>
                <option value="">All</option>
                <option value="true">Fraud Only</option>
                <option value="false">Legitimate</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Channel</label>
              <select className="input text-sm" value={filters.channel}
                onChange={e => applyFilter('channel', e.target.value)}>
                <option value="">All</option>
                {['online', 'atm', 'branch', 'mobile', 'pos'].map(v =>
                  <option key={v} value={v}>{v}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block font-medium">Status</label>
              <select className="input text-sm" value={filters.status}
                onChange={e => applyFilter('status', e.target.value)}>
                <option value="">All</option>
                {['completed', 'pending', 'failed', 'reversed'].map(v =>
                  <option key={v} value={v}>{v}</option>
                )}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && meta?.total > 0 && (
        <p className="text-xs text-slate-400 px-1">
          {meta.total.toLocaleString()} transactions found
        </p>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <LoadingPage />
          ) : transactions?.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No transactions found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Transaction ID', 'Customer', 'Amount', 'Type', 'Merchant', 'Channel', 'Risk', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(txn => (
                  <tr key={txn.id} className={`hover:bg-slate-50 transition-colors ${txn.is_fraud ? 'bg-red-50/30' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {txn.is_fraud && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" title="Fraud detected" />
                        )}
                        <span className="font-mono text-xs text-blue-600">{txn.transaction_id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{txn.customer_name}</td>
                    <td className={`py-3 px-4 font-semibold whitespace-nowrap ${txn.is_fraud ? 'text-red-600' : 'text-slate-800'}`}>
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-500">{txn.transaction_type}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-[130px] truncate" title={txn.merchant_name}>
                      {txn.merchant_name}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-500">{txn.channel}</td>
                    <td className="py-3 px-4"><RiskBadge level={txn.risk_level} /></td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        txn.status === 'completed' ? 'bg-green-50 text-green-700' :
                        txn.status === 'failed'    ? 'bg-red-50 text-red-700' :
                        txn.status === 'reversed'  ? 'bg-purple-50 text-purple-700' :
                        'bg-yellow-50 text-yellow-700'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(txn.transaction_date)}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/transactions/${txn.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta && transactions?.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <Pagination meta={meta} onPageChange={goToPage} />
          </div>
        )}
      </div>
    </div>
  )
}
