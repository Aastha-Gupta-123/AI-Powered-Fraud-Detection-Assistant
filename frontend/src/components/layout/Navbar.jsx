import { useState, useRef, useEffect, useMemo } from 'react'
import { Menu, Bell, Search, User, LogOut, ChevronDown, ShieldCheck, Activity, Sparkles } from 'lucide-react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transactions',
  '/fraud-detection': 'Fraud Detection',
  '/investigations': 'Investigations',
  '/reports': 'Reports',
  '/analytics': 'Analytics',
  '/profile': 'My Profile',
  '/customer-chat': 'Customer Chat',
}

const QUICK_LINKS = [
  { path: '/dashboard', label: 'Dashboard', desc: 'Overview and fraud activity' },
  { path: '/transactions', label: 'Transactions', desc: 'Browse and review transaction records' },
  { path: '/fraud-detection', label: 'Fraud Detection', desc: 'Analyze suspicious patterns' },
  { path: '/investigations', label: 'Investigations', desc: 'Track and manage cases' },
  { path: '/reports', label: 'Reports', desc: 'Generate PDF reports' },
  { path: '/analytics', label: 'Analytics', desc: 'Charts and risk insights' },
  { path: '/customer-chat', label: 'Customer Chat', desc: 'AI-assisted support and guidance' },
  { path: '/profile', label: 'Profile', desc: 'User account and settings' },
]

export default function Navbar({ onMenuClick }) {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [aiOpen, setAiOpen] = useState(false)
  const [now, setNow] = useState(new Date())
  const dropRef = useRef()
  const notifyRef = useRef()
  const searchRef = useRef()
  const aiRef = useRef()

  const title = Object.entries(PAGE_TITLES).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'FraudGuard'

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target)) {
        setNotificationsOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }
      if (aiRef.current && !aiRef.current.contains(e.target)) {
        setAiOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const formatTime = (date) => date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const formatDate = (date) => date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const filteredLinks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return QUICK_LINKS

    return QUICK_LINKS.filter(link =>
      link.label.toLowerCase().includes(query) ||
      link.desc.toLowerCase().includes(query)
    )
  }, [searchQuery])

  const notifications = [
    { id: 1, text: '3 high-risk transactions need review', time: '2 min ago' },
    { id: 2, text: 'Fraud alerts synced successfully', time: '10 min ago' },
    { id: 3, text: 'System health is stable', time: '18 min ago' },
  ]

  return (
    <header className="h-16 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 flex-shrink-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-slate-300 hover:text-white lg:hidden p-1.5 rounded-lg hover:bg-white/10"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-[11px] uppercase tracking-[0.35em] text-blue-300">FraudGuard AI</p>
          <h1 className="font-semibold text-white text-lg leading-none">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-100 shadow-inner shadow-emerald-500/10">
          <Activity size={12} className="text-emerald-300" />
          <span>System Healthy</span>
        </div>

        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200 shadow-inner shadow-slate-900/40">
          <ShieldCheck size={12} className="text-blue-300" />
          <span>{formatDate(now)}</span>
          <span className="text-slate-400">•</span>
          <span className="font-medium text-white">{formatTime(now)}</span>
        </div>

        {/* Search bar - hidden on mobile */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSearchOpen(true)
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search pages, reports, chat..."
            className="w-64 rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none ring-0 transition hover:bg-white/10 focus:border-blue-400 focus:bg-white/10"
          />

          {searchOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-slate-950/95 shadow-[0_18px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl z-50 overflow-hidden">
              <div className="border-b border-white/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-slate-400">Quick Search</div>
              <div className="max-h-72 overflow-y-auto">
                {filteredLinks.length > 0 ? filteredLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                    className="block border-b border-white/5 px-4 py-3 hover:bg-white/10"
                  >
                    <p className="text-sm font-medium text-white">{link.label}</p>
                    <p className="text-xs text-slate-400">{link.desc}</p>
                  </Link>
                )) : (
                  <div className="px-4 py-4 text-sm text-slate-300">No matches found for “{searchQuery}”.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={aiRef}>
          <button
            type="button"
            onClick={() => setAiOpen(v => !v)}
            className="hidden rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-100 shadow-inner shadow-emerald-500/10 transition hover:bg-emerald-400/15 md:inline-flex items-center gap-1.5"
          >
            <Sparkles size={12} className="text-emerald-200" />
            Enterprise AI
          </button>

          {aiOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-slate-950/95 shadow-[0_18px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white">Enterprise AI</p>
                <p className="text-xs text-slate-400">Fraud intelligence, chat support, API-ready workflows</p>
              </div>
              <div className="px-4 py-3 text-sm text-slate-200 space-y-2">
                <p>• AI-assisted fraud analysis</p>
                <p>• Customer chat support</p>
                <p>• Twilio-ready alerts and integrations</p>
                <p>• Analytics and reporting dashboards</p>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => setNotificationsOpen(v => !v)}
            className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-950" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 rounded-2xl border border-white/10 bg-slate-950/95 shadow-[0_18px_60px_rgba(15,23,42,0.45)] overflow-hidden z-50 backdrop-blur-xl">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-white">Notifications</p>
                <p className="text-xs text-slate-400">Latest alerts and system updates</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left hover:bg-white/10"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="flex-1">
                      <span className="block text-sm text-slate-100">{item.text}</span>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/20">
              {user?.full_name?.[0] || 'U'}
            </div>
            <span className="hidden md:block text-sm font-medium text-slate-100">
              {user?.full_name?.split(' ')[0]}
            </span>
            <ChevronDown size={14} className={`text-slate-300 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-2xl border border-white/10 bg-slate-950/95 shadow-[0_18px_60px_rgba(15,23,42,0.45)] overflow-hidden z-50 backdrop-blur-xl">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="font-semibold text-white text-sm">{user?.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role} · {user?.department}</p>
              </div>
              <Link
                to="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-200 hover:bg-white/10"
              >
                <User size={15} />
                My Profile
              </Link>
              <button
                onClick={() => { setDropdownOpen(false); logout() }}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-200 hover:bg-rose-500/10 w-full border-t border-white/10"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
