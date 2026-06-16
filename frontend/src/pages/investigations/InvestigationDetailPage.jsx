import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Send } from 'lucide-react'
import { investigationsApi } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'
import { LoadingPage, RiskBadge, Modal } from '../../components/ui'
import { formatCurrency, formatDate, statusColor } from '../../utils/helpers'
import toast from 'react-hot-toast'

export default function InvestigationDetailPage() {
  const { id } = useParams()
  const { data: inv, loading, refetch } = useFetch(() => investigationsApi.get(id), [id])
  const [note, setNote] = useState('')
  const [noteType, setNoteType] = useState('comment')
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <LoadingPage />
  if (!inv) return null

  const txn = inv.transaction

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!note.trim()) return
    setSubmitting(true)
    try {
      await investigationsApi.addNote(id, { note_text: note, note_type: noteType })
      setNote('')
      refetch()
      toast.success('Note added')
    } catch { toast.error('Failed to add note') }
    finally { setSubmitting(false) }
  }

  const handleUpdate = async () => {
    try {
      await investigationsApi.update(id, editForm)
      setEditMode(false)
      refetch()
      toast.success('Investigation updated')
    } catch { toast.error('Update failed') }
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to="/investigations" className="p-2 hover:bg-slate-100 rounded-lg mt-0.5">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-bold text-slate-800 text-lg">{inv.case_number}</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColor(inv.status)}`}>
              {inv.status?.replace('_', ' ')}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">{inv.title}</p>
        </div>
        <button onClick={() => { setEditMode(true); setEditForm({ status: inv.status, priority: inv.priority, investigator_remarks: inv.investigator_remarks || '' }) }}
          className="btn-secondary text-sm">
          Update Status
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="md:col-span-2 space-y-5">
          {/* AI Explanation */}
          {inv.fraud_explanation && (
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2 text-sm">🤖 AI Fraud Explanation</h3>
              <p className="text-sm text-blue-700 leading-relaxed">{inv.fraud_explanation}</p>
            </div>
          )}

          {/* Description */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-2">Description</h3>
            <p className="text-sm text-slate-600">{inv.description || 'No description provided'}</p>
          </div>

          {/* Investigator Remarks */}
          {inv.investigator_remarks && (
            <div className="card bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2 text-sm">Investigator Remarks</h3>
              <p className="text-sm text-yellow-700">{inv.investigator_remarks}</p>
            </div>
          )}

          {/* Notes */}
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <MessageSquare size={16} />
              Case Notes ({inv.notes?.length || 0})
            </h3>

            <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
              {inv.notes?.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No notes yet</p>
              )}
              {inv.notes?.map(n => (
                <div key={n.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                    {n.author_name?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-slate-700">{n.author_name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        n.note_type === 'action' ? 'bg-blue-50 text-blue-600' :
                        n.note_type === 'evidence' ? 'bg-purple-50 text-purple-600' :
                        n.note_type === 'escalation' ? 'bg-red-50 text-red-600' :
                        'bg-slate-50 text-slate-500'
                      }`}>{n.note_type}</span>
                      <span className="text-xs text-slate-400">{formatDate(n.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{n.note_text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <select className="input text-sm w-32" value={noteType} onChange={e => setNoteType(e.target.value)}>
                {['comment', 'action', 'evidence', 'escalation'].map(t => <option key={t}>{t}</option>)}
              </select>
              <input
                className="input flex-1 text-sm"
                placeholder="Add a note..."
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <button type="submit" disabled={submitting} className="btn-primary px-3">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-700 mb-3 text-sm">Case Details</h3>
            {[
              ['Investigator', inv.investigator_name || 'Unassigned'],
              ['Priority', inv.priority],
              ['Assigned', formatDate(inv.assigned_at)],
              ['Resolved', inv.resolved_at ? formatDate(inv.resolved_at) : 'Pending'],
              ['Confirmed Fraud', inv.is_confirmed_fraud == null ? 'Pending' : inv.is_confirmed_fraud ? 'Yes' : 'No'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium text-slate-700 capitalize">{v}</span>
              </div>
            ))}
          </div>

          {txn && (
            <div className="card">
              <h3 className="font-semibold text-slate-700 mb-3 text-sm">Linked Transaction</h3>
              <Link to={`/transactions/${txn.id}`} className="block">
                <div className="space-y-2">
                  <p className="font-mono text-xs text-blue-600">{txn.transaction_id}</p>
                  <p className="font-bold text-slate-800 text-lg">{formatCurrency(txn.amount)}</p>
                  <RiskBadge level={txn.risk_level} />
                  <p className="text-xs text-slate-400">{txn.merchant_name}</p>
                  <p className="text-xs text-slate-400">{formatDate(txn.transaction_date)}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      <Modal open={editMode} onClose={() => setEditMode(false)} title="Update Investigation">
        <div className="space-y-4">
          {[
            { label: 'Status', key: 'status', opts: ['open', 'in_progress', 'resolved', 'escalated', 'closed'] },
            { label: 'Priority', key: 'priority', opts: ['low', 'medium', 'high', 'critical'] },
          ].map(({ label, key, opts }) => (
            <div key={key}>
              <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>
              <select className="input" value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}>
                {opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Investigator Remarks</label>
            <textarea className="input h-24 resize-none" value={editForm.investigator_remarks || ''}
              onChange={e => setEditForm(f => ({ ...f, investigator_remarks: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditMode(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleUpdate} className="btn-primary flex-1">Save Changes</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
