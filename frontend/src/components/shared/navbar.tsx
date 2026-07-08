import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <nav className="border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-xl font-bold">
          AuthForge
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/profile')}>
                <Avatar className="mr-2 h-8 w-8">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback>{user.name?.[0] || user.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                {user.name || user.email}
              </Button>
              <Button variant="outline" size="sm" onClick={() => logout().then(() => navigate('/login'))}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
