import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import {
  LayoutDashboard,
  User,
  Shield,
  Key,
  Fingerprint,
  LogOut,
  Users,
  BarChart3,
  Monitor,
  History,
} from 'lucide-react'

const userLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/dashboard/profile', icon: User, label: 'Profile' },
  { to: '/dashboard/security', icon: Shield, label: 'Security' },
  { to: '/dashboard/sessions', icon: Monitor, label: 'Sessions' },
  { to: '/dashboard/passkeys', icon: Fingerprint, label: 'Passkeys' },
  { to: '/dashboard/mfa', icon: Key, label: 'MFA' },
  { to: '/dashboard/login-history', icon: History, label: 'Login History' },
]

const adminLinks = [
  { to: '/admin', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/users', icon: Users, label: 'Users' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="flex w-64 flex-col border-r bg-card">
      <nav className="flex-1 space-y-1 p-4">
        <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">General</p>
        {userLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
        {user?.role === 'admin' && (
          <>
            <p className="mt-6 px-3 text-xs font-semibold uppercase text-muted-foreground">Admin</p>
            {adminLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/admin'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="border-t p-4">
        <button
          onClick={() => logout().then(() => navigate('/login'))}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
