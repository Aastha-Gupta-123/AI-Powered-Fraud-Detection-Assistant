import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { analyticsApi } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'
import { LoadingPage } from '../../components/ui'
import { formatCurrency } from '../../utils/helpers'

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']
const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)

  const { data: trends, loading: tLoading } = useFetch(() => analyticsApi.fraudTrends(days), [days])
  const { data: riskDist } = useFetch(() => analyticsApi.riskDistribution())
  const { data: channels } = useFetch(() => analyticsApi.channelBreakdown())
  const { data: monthly } = useFetch(() => analyticsApi.monthlySummary())
  const { data: topMerchants } = useFetch(() => analyticsApi.topMerchants())

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-700">Fraud Analytics Overview</h2>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                days === d ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Fraud trend line */}
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4">Daily Fraud vs Legitimate Transactions</h3>
        {tLoading ? <LoadingPage /> : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trends || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '8px' }}
                formatter={(v, name) => [v, name === 'fraud_count' ? 'Fraud' : 'Total']} />
              <Legend />
              <Line name="total" dataKey="total" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line name="fraud_count" dataKey="fraud_count" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk distribution pie */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Risk Level Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={riskDist || []} dataKey="count" nameKey="risk_level" cx="50%" cy="50%" outerRadius={80} label={({risk_level, percent}) => `${risk_level} ${(percent*100).toFixed(0)}%`}>
                {(riskDist || []).map((entry) => (
                  <Cell key={entry.risk_level} fill={RISK_COLORS[entry.risk_level] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Channel breakdown */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Fraud by Channel</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={channels || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar name="Total" dataKey="total" fill="#93c5fd" radius={[4,4,0,0]} />
              <Bar name="Fraud" dataKey="fraud" fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly summary */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Monthly Fraud Amount</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(monthly || []).map(m => ({ ...m, month_label: MONTH_NAMES[m.month-1] }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month_label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v, n) => [formatCurrency(v), n]} />
              <Bar name="total_amount" dataKey="total_amount" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top merchants */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Top Fraud Merchants</h3>
          {(topMerchants || []).length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No data</p>
          ) : (
            <div className="space-y-3">
              {topMerchants.slice(0, 6).map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-4">{i+1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-0.5">
                      <span className="font-medium text-slate-700 truncate">{m.merchant}</span>
                      <span className="text-red-600 font-semibold ml-2">{m.fraud_count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-red-400 h-1.5 rounded-full"
                        style={{ width: `${(m.fraud_count / topMerchants[0].fraud_count) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
