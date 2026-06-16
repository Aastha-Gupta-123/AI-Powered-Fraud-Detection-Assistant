import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { user, login } = useAuth()
  const [form, setForm] = useState({ username: 'admin', password: 'password123' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back!')
    } catch (err) {
      const status = err.response?.status
      const backendMessage = err.response?.data?.error

      if (err.code === 'ERR_NETWORK' || !err.response) {
        toast.error('The backend server is not responding. Start the Flask API, then try again.')
      } else if (status === 401) {
        toast.error(backendMessage || 'Invalid username or password. Please use the demo credentials shown below.')
      } else {
        toast.error(backendMessage || 'Login failed. Please check your credentials and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell flex min-h-screen items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 0)', backgroundSize: '36px 36px' }}
      />

      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel p-8 text-white shadow-2xl">
          <p className="text-[11px] uppercase tracking-[0.4em] text-blue-200">FraudGuard AI</p>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">Modern fraud intelligence for fast-moving teams.</h1>
          <p className="mt-4 max-w-md text-slate-200/90">Monitor transactions, investigate suspicious activity, and support customers with an AI-driven operations portal designed for enterprise workflows.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ['AI Assistance', 'Rule-based analytics and customer support chat'],
              ['Twilio-ready', 'SMS and alert integrations for urgent cases'],
              ['Actionable Reports', 'PDF and dashboard summaries for operations'],
              ['Secure Access', 'Role-based dashboard for analysts and investigators']
            ].map(([title, text]) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/8 p-4 shadow-lg shadow-slate-950/20">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-xs text-slate-200/80">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="glass-panel p-6 md:p-8">
          <div className="bg-white rounded-3xl p-8 shadow-[0_18px_60px_rgba(15,23,42,0.35)]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-xl leading-none">FraudGuard AI</h1>
              <p className="text-slate-400 text-xs uppercase tracking-[0.25em]">Detection & Investigation</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Sign in</h2>
          <p className="text-slate-400 text-sm mb-6">Access your fraud monitoring dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <input
                className="input"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-700 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-blue-600">
              <p>👤 Admin: <code>admin</code> / <code>password123</code></p>
              <p>🔍 Analyst: <code>analyst1</code> / <code>password123</code></p>
              <p>🕵️ Investigator: <code>investigator1</code> / <code>password123</code></p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
