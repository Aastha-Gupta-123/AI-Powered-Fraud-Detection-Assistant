import { useState, useRef } from 'react'
import { Upload, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react'
import { fraudApi } from '../../services/api'
import { RiskBadge, LoadingPage } from '../../components/ui'
import { formatCurrency } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function FraudDetectionPage() {
  const [mode, setMode] = useState('single') // 'single' | 'upload'
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)
  const fileRef = useRef()

  const [form, setForm] = useState({
    amount: '',
    transaction_type: 'debit',
    channel: 'online',
    transaction_date: new Date().toISOString().slice(0, 16),
    merchant_name: '',
    location: ''
  })

  const handleSinglePredict = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const res = await fraudApi.predict(form)
      setResult(res.data)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Prediction failed')
    } finally { setLoading(false) }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setUploadResult(null)
    try {
      const res = await fraudApi.upload(file)
      setUploadResult(res.data)
      toast.success(`Processed ${res.data.total_processed} transactions`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Mode toggle */}
      <div className="card p-2">
        <div className="flex gap-1">
          {[
            { key: 'single', label: 'Single Transaction' },
            { key: 'upload', label: 'Batch CSV Upload' }
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                mode === m.key ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'single' ? (
        <div className="grid md:grid-cols-2 gap-5">
          {/* Form */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Transaction Details</h3>
            <form onSubmit={handleSinglePredict} className="space-y-3">
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Amount ($)</label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Type</label>
                  <select className="input" value={form.transaction_type}
                    onChange={e => setForm(f => ({ ...f, transaction_type: e.target.value }))}>
                    {['debit', 'credit', 'transfer', 'withdrawal', 'deposit'].map(t =>
                      <option key={t}>{t}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-600 mb-1 block">Channel</label>
                  <select className="input" value={form.channel}
                    onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                    {['online', 'atm', 'branch', 'mobile', 'pos'].map(c =>
                      <option key={c}>{c}</option>
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Date & Time</label>
                <input className="input" type="datetime-local" value={form.transaction_date}
                  onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm text-slate-600 mb-1 block">Merchant</label>
                <input className="input" placeholder="Merchant name" value={form.merchant_name}
                  onChange={e => setForm(f => ({ ...f, merchant_name: e.target.value }))} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Analyzing...' : '🤖 Analyze Transaction'}
              </button>
            </form>
          </div>

          {/* Result */}
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-4">Detection Result</h3>
            {loading && <LoadingPage />}
            {!loading && !result && (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <ShieldAlert size={40} className="mb-3 opacity-30" />
                <p className="text-sm">Submit a transaction to see results</p>
              </div>
            )}
            {result && (
              <div className="space-y-4">
                <div className={`rounded-xl p-5 text-center ${result.is_fraud ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  {result.is_fraud ? (
                    <AlertTriangle size={40} className="mx-auto text-red-500 mb-2" />
                  ) : (
                    <CheckCircle size={40} className="mx-auto text-green-500 mb-2" />
                  )}
                  <p className={`text-xl font-bold ${result.is_fraud ? 'text-red-700' : 'text-green-700'}`}>
                    {result.is_fraud ? 'FRAUD DETECTED' : 'LEGITIMATE'}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Confidence: {(result.fraud_score * 100).toFixed(1)}%
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Fraud Risk Score</span>
                    <span className="font-bold">{(result.fraud_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${
                        result.fraud_score > 0.7 ? 'bg-red-500' :
                        result.fraud_score > 0.5 ? 'bg-orange-500' :
                        result.fraud_score > 0.3 ? 'bg-yellow-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${result.fraud_score * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">Risk Level</span>
                  <RiskBadge level={result.risk_level} />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CSV Upload */
        <div className="space-y-5">
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-2">Batch Detection via CSV</h3>
            <p className="text-sm text-slate-500 mb-5">
              Upload a CSV with columns: <code>transaction_id, amount, transaction_type, channel, transaction_date</code>
            </p>

            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Upload size={36} className="mx-auto text-slate-400 mb-3" />
              <p className="font-medium text-slate-600">Click to upload CSV</p>
              <p className="text-sm text-slate-400 mt-1">Max 5,000 rows, .csv files only</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </div>
          </div>

          {loading && <LoadingPage />}

          {uploadResult && (
            <div className="card">
              <div className="flex items-center gap-4 mb-5">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <ShieldAlert className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Batch Analysis Complete</h3>
                  <p className="text-sm text-slate-500">
                    {uploadResult.fraud_detected} fraud detected out of {uploadResult.total_processed} transactions
                    ({((uploadResult.fraud_detected / uploadResult.total_processed) * 100).toFixed(1)}% rate)
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Transaction ID', 'Amount', 'Risk Score', 'Risk Level', 'Verdict'].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs text-slate-500 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.results.slice(0, 50).map((r, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${r.is_fraud ? 'bg-red-50' : ''}`}>
                        <td className="py-2 px-3 font-mono text-xs">{r.transaction_id || '-'}</td>
                        <td className="py-2 px-3">{r.amount ? formatCurrency(r.amount) : '-'}</td>
                        <td className="py-2 px-3">{(r.fraud_score * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3"><RiskBadge level={r.risk_level} /></td>
                        <td className="py-2 px-3">
                          <span className={`text-xs font-semibold ${r.is_fraud ? 'text-red-600' : 'text-green-600'}`}>
                            {r.is_fraud ? '⚠ FRAUD' : '✓ OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {uploadResult.results.length > 50 && (
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Showing first 50 of {uploadResult.results.length} results
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
