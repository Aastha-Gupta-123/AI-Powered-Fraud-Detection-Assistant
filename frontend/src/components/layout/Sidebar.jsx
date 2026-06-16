import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CreditCard, ShieldAlert, Search,
  FileText, BarChart3, MessageSquareText, LogOut, ShieldCheck, X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions',     icon: CreditCard,      label: 'Transactions' },
  { to: '/fraud-detection',  icon: ShieldAlert,     label: 'Fraud Detection' },
  { to: '/investigations',   icon: Search,          label: 'Investigations' },
  { to: '/reports',          icon: FileText,        label: 'Reports' },
  { to: '/analytics',        icon: BarChart3,       label: 'Analytics' },
  { to: '/customer-chat',    icon: MessageSquareText, label: 'Customer Chat' },
]

export default function Sidebar({ open, onClose }) {
  const { logout, user } = useAuth()

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 flex flex-col
        bg-[linear-gradient(180deg,#020617_0%,#111827_45%,#0f172a_100%)] border-r border-white/10
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:z-auto
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">FraudGuard</p>
              <p className="text-slate-400 text-[11px] uppercase tracking-[0.25em]">AI Detection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white lg:hidden p-1 rounded-lg hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.35em] px-3 mb-3">
            Main Menu
          </p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <div className="mb-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-100">
            <p className="font-semibold uppercase tracking-[0.25em] text-emerald-200">Status</p>
            <p className="mt-1 text-slate-100">AI monitoring and customer support workflows are live.</p>
          </div>
          <NavLink
            to="/profile"
            onClick={onClose}
            className={({ isActive }) => `sidebar-link mb-1 ${isActive ? 'active' : ''}`}
          >
            <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate leading-none mb-0.5">{user?.full_name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </NavLink>
          <button
            onClick={logout}
            className="sidebar-link w-full !text-red-400 hover:!text-red-300 hover:!bg-red-500/10"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
