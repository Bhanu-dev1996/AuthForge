import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      if (err?.error?.message) setError(err.error.message)
      else if (err?.mfaRequired) navigate('/mfa-challenge', { state: { userId: err.userId } })
      else setError('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 space-y-2 text-center text-sm">
            <Link to="/forgot-password" className="text-muted-foreground hover:text-foreground">Forgot password?</Link>
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 border-t" />
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="flex-1 border-t" />
            </div>
            <div className="flex gap-3">
              <a href={`${import.meta.env.VITE_API_URL || '/api/v1'}/oauth/google`} className="flex-1">
                <Button variant="outline" className="w-full">Google</Button>
              </a>
              <a href={`${import.meta.env.VITE_API_URL || '/api/v1'}/oauth/github`} className="flex-1">
                <Button variant="outline" className="w-full">GitHub</Button>
              </a>
            </div>
            <p className="mt-4">
              Don&apos;t have an account? <Link to="/register" className="font-medium text-primary hover:underline">Sign up</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
