import { useState } from 'react'
import { FileText, Download, Plus } from 'lucide-react'
import { reportsApi } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'
import { LoadingPage, EmptyState, Modal } from '../../components/ui'
import { formatDate, downloadBlob } from '../../utils/helpers'
import toast from 'react-hot-toast'

const reportTypes = [
  { value: 'fraud_summary', label: 'Fraud Summary Report', desc: 'Overview of all fraud activity' },
  { value: 'transaction_audit', label: 'Transaction Audit', desc: 'Detailed transaction log' },
  { value: 'investigation_report', label: 'Investigation Report', desc: 'All investigation cases' },
  { value: 'risk_assessment', label: 'Risk Assessment', desc: 'Risk scoring analysis' },
]

export default function ReportsPage() {
  const { data: reports, loading, refetch } = useFetch(() => reportsApi.list())
  const [showModal, setShowModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [form, setForm] = useState({ report_type: 'fraud_summary', title: '' })

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const title = form.title || reportTypes.find(r => r.value === form.report_type)?.label
      await reportsApi.generate({ ...form, title })
      setShowModal(false)
      refetch()
      toast.success('Report generated successfully')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed')
    } finally { setGenerating(false) }
  }

  const handleDownload = async (report) => {
    try {
      const res = await reportsApi.download(report.id)
      downloadBlob(res.data, `${report.report_id}.pdf`)
      toast.success('Download started')
    } catch { toast.error('Download failed') }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Generate Report
        </button>
      </div>

      {loading ? <LoadingPage /> : reports?.length === 0 ? (
        <div className="card">
          <EmptyState icon={FileText} title="No reports yet" description="Generate your first report to get started" />
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map(report => (
            <div key={report.id} className="card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                report.status === 'ready' ? 'bg-green-50' :
                report.status === 'failed' ? 'bg-red-50' : 'bg-yellow-50'
              }`}>
                <FileText size={20} className={
                  report.status === 'ready' ? 'text-green-600' :
                  report.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                } />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{report.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {report.report_id} · By {report.generated_by_name} · {formatDate(report.created_at)}
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                report.status === 'ready' ? 'bg-green-100 text-green-700' :
                report.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {report.status}
              </span>
              {report.status === 'ready' && (
                <button
                  onClick={() => handleDownload(report)}
                  className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
                >
                  <Download size={14} />
                  Download
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Generate New Report">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Report Type</label>
            <div className="space-y-2">
              {reportTypes.map(rt => (
                <label key={rt.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.report_type === rt.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input type="radio" name="report_type" value={rt.value}
                    checked={form.report_type === rt.value}
                    onChange={e => setForm(f => ({ ...f, report_type: e.target.value }))}
                    className="mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{rt.label}</p>
                    <p className="text-xs text-slate-400">{rt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Custom Title (optional)</label>
            <input className="input" placeholder="Leave blank for default title"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleGenerate} disabled={generating} className="btn-primary flex-1">
              {generating ? 'Generating...' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
