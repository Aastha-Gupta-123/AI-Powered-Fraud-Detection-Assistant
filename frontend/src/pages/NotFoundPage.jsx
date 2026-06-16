import { Link } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={36} className="text-slate-400" />
        </div>
        <h1 className="text-6xl font-bold text-slate-800 mb-2">404</h1>
        <p className="text-slate-500 mb-6">Page not found</p>
        <Link to="/dashboard" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
