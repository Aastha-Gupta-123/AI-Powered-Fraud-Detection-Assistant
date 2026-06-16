import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Flag, ShieldAlert, Plus } from 'lucide-react'
import { transactionsApi, fraudApi, investigationsApi } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'
import { LoadingPage, RiskBadge, Modal } from '../../components/ui'
import { formatCurrency, formatDate } from '../../utils/helpers'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function TransactionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: txn, loading, refetch } = useFetch(() => transactionsApi.get(id), [id])
  const [explainLoading, setExplainLoading] = useState(false)
  const [explanation, setExplanation] = useState(null)
  const [showInvModal, setShowInvModal] = useState(false)
  const [invForm, setInvForm] = useState({ priority: 'medium', description: '' })

  if (loading) return <LoadingPage />
  if (!txn) return null

  const handleFlag = async () => {
    await transactionsApi.flag(id)
    toast.success(txn.flagged_for_review ? 'Flag removed' : 'Transaction flagged')
    refetch()
  }

  const handleExplain = async () => {
    setExplainLoading(true)
    try {
      const res = await fraudApi.explain(id)
      setExplanation(res.data.explanation)
    } catch { toast.error('Could not generate explanation') }
    finally { setExplainLoading(false) }
  }

  const handleCreateInvestigation = async () => {
    try {
      const res = await investigationsApi.create({
        transaction_id: txn.id,
        ...invForm,
        title: `Investigation: ${txn.transaction_id}`,
        fraud_explanation: explanation || ''
      })
      toast.success(`Case ${res.data.case_number} created`)
      setShowInvModal(false)
      navigate(`/investigations/${res.data.id}`)
    } catch { toast.error('Failed to create investigation') }
  }

  const fields = [
    ['Transaction ID', txn.transaction_id],
    ['Account Number', txn.account_number],
    ['Customer', txn.customer_name],
    ['Amount', formatCurrency(txn.amount)],
    ['Type', txn.transaction_type],
    ['Merchant', txn.merchant_name],
    ['Category', txn.merchant_category],
    ['Channel', txn.channel],
    ['Location', txn.location],
    ['IP Address', txn.ip_address],
    ['Device', txn.device_type],
    ['Status', txn.status],
    ['Date', formatDate(txn.transaction_date)],
  ]

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/transactions" className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h2 className="font-bold text-slate-800 text-lg">{txn.transaction_id}</h2>
          <p className="text-sm text-slate-400">Transaction Detail</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleFlag} className="btn-secondary flex items-center gap-2 text-sm">
            <Flag size={15} className={txn.flagged_for_review ? 'text-orange-500' : ''} />
            {txn.flagged_for_review ? 'Unflag' : 'Flag'}
          </button>
          {!txn.investigation && (
            <button onClick={() => setShowInvModal(true)} className="btn-danger flex items-center gap-2 text-sm">
              <Plus size={15} />
              Investigate
            </button>
          )}
        </div>
      </div>

      {/* Fraud indicator */}
      {txn.is_fraud && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <p className="font-semibold text-red-700">Fraud Detected</p>
            <p className="text-sm text-red-600">
              Risk score: <strong>{(txn.fraud_score * 100).toFixed(1)}%</strong> — Risk level: <strong>{txn.risk_level?.toUpperCase()}</strong>
            </p>
          </div>
          <RiskBadge level={txn.risk_level} />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Details */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Transaction Details</h3>
          <dl className="space-y-3">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-800 capitalize text-right max-w-[200px] truncate">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Fraud Analysis */}
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">AI Fraud Analysis</h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-500">Fraud Probability</span>
              <span className="font-bold text-slate-800">{(txn.fraud_score * 100).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  txn.fraud_score > 0.7 ? 'bg-red-500' :
                  txn.fraud_score > 0.5 ? 'bg-orange-500' :
                  txn.fraud_score > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${txn.fraud_score * 100}%` }}
              />
            </div>
          </div>

          {explanation ? (
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-slate-700 mb-3">
              {explanation}
            </div>
          ) : (
            <button
              onClick={handleExplain}
              disabled={explainLoading}
              className="btn-primary w-full text-sm mb-3"
            >
              {explainLoading ? 'Analyzing...' : '🤖 Generate AI Explanation'}
            </button>
          )}

          {txn.investigation && (
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs font-medium text-orange-700 mb-1">Active Investigation</p>
              <Link to={`/investigations/${txn.investigation.id}`} className="text-sm font-semibold text-orange-600 hover:underline">
                {txn.investigation.case_number}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Create Investigation Modal */}
      <Modal open={showInvModal} onClose={() => setShowInvModal(false)} title="Create Investigation">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Priority</label>
            <select
              className="input"
              value={invForm.priority}
              onChange={e => setInvForm(f => ({ ...f, priority: e.target.value }))}
            >
              {['low', 'medium', 'high', 'critical'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Initial Description</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Initial investigation notes..."
              value={invForm.description}
              onChange={e => setInvForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowInvModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleCreateInvestigation} className="btn-danger flex-1">Create Case</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
