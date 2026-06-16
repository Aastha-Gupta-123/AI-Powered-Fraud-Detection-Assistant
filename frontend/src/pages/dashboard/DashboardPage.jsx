import { ShieldAlert, CreditCard, AlertTriangle, TrendingUp, Activity, Search } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { StatCard, LoadingPage, ErrorState, RiskBadge } from '../../components/ui'
import { dashboardApi, analyticsApi } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { data: summary, loading: sumLoading, error: sumError } = useFetch(() => dashboardApi.summary())
  const { data: activity, loading: actLoading } = useFetch(() => dashboardApi.recentActivity())
  const { data: trends } = useFetch(() => analyticsApi.fraudTrends(14))

  if (sumLoading) return <LoadingPage />
  if (sumError) return <ErrorState message={sumError} />

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Transactions"
          value={summary?.total_transactions?.toLocaleString()}
          subtitle="All time"
          icon={CreditCard}
          color="blue"
        />
        <StatCard
          title="Fraud Detected"
          value={summary?.fraud_transactions?.toLocaleString()}
          subtitle={`${summary?.fraud_rate}% fraud rate`}
          icon={ShieldAlert}
          color="red"
          trend={8}
        />
        <StatCard
          title="Open Investigations"
          value={summary?.open_investigations?.toLocaleString()}
          subtitle="Requires attention"
          icon={Search}
          color="orange"
        />
        <StatCard
          title="Total Fraud Amount"
          value={formatCurrency(summary?.total_fraud_amount || 0)}
          subtitle="Cumulative losses"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Fraud Trend (Last 14 days)</h2>
            <span className="badge-high">Live</span>
          </div>
          {trends?.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(v, n) => [v, n === 'fraud_count' ? 'Fraud' : 'Total']}
                />
                <Line dataKey="total" stroke="#93c5fd" strokeWidth={2} dot={false} name="total" />
                <Line dataKey="fraud_count" stroke="#ef4444" strokeWidth={2} dot={false} name="fraud_count" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-slate-400">No trend data yet</div>
          )}
        </div>

        {/* Quick stats */}
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">This Month</h2>
          <div className="space-y-4">
            {[
              { label: 'Fraud Last 30 Days', value: summary?.fraud_last_30_days, color: 'text-red-600' },
              { label: 'Flagged for Review', value: summary?.flagged_transactions, color: 'text-orange-600' },
              { label: 'Fraud Rate', value: `${summary?.fraud_rate}%`, color: 'text-blue-600' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-600">{item.label}</span>
                <span className={`font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
          <Link to="/fraud-detection" className="btn-primary w-full text-center block mt-4 text-sm">
            Run Detection
          </Link>
        </div>
      </div>

      {/* Recent fraud transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2">
            <Activity size={18} className="text-red-500" />
            Recent Fraud Activity
          </h2>
          <Link to="/transactions?is_fraud=true" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {actLoading ? (
          <LoadingPage />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Transaction ID', 'Customer', 'Amount', 'Risk', 'Channel', 'Date'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activity?.recent_fraud?.slice(0, 8).map(txn => (
                  <tr key={txn.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <Link to={`/transactions/${txn.id}`} className="font-mono text-blue-600 hover:underline text-xs">
                        {txn.transaction_id}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{txn.customer_name}</td>
                    <td className="py-2.5 px-3 font-medium text-red-600">{formatCurrency(txn.amount)}</td>
                    <td className="py-2.5 px-3"><RiskBadge level={txn.risk_level} /></td>
                    <td className="py-2.5 px-3 capitalize text-slate-500">{txn.channel}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs">{formatDate(txn.transaction_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
