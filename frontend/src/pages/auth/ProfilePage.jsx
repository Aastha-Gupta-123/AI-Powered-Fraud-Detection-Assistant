import { useAuth } from '../../context/AuthContext'
import { User, Mail, Building, Shield, Clock } from 'lucide-react'
import { formatDate } from '../../utils/helpers'

export default function ProfilePage() {
  const { user } = useAuth()

  const roleColors = {
    admin: 'bg-purple-100 text-purple-700',
    analyst: 'bg-blue-100 text-blue-700',
    investigator: 'bg-orange-100 text-orange-700',
    viewer: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div className="card">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.full_name?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user?.full_name}</h2>
            <p className="text-slate-400 text-sm">@{user?.username}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block capitalize ${roleColors[user?.role]}`}>
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4">Account Details</h3>
        <div className="space-y-4">
          {[
            { icon: User, label: 'Full Name', value: user?.full_name },
            { icon: Mail, label: 'Email', value: user?.email },
            { icon: Building, label: 'Department', value: user?.department },
            { icon: Shield, label: 'Role', value: user?.role },
            { icon: Clock, label: 'Last Login', value: formatDate(user?.last_login) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-medium text-slate-700 capitalize">{value || '-'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
