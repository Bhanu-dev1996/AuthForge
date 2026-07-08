import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided')
      return
    }
    api.post('/auth/verify-email', { token })
      .then(() => {
        setStatus('success')
        setMessage('Email verified successfully!')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.error?.message || 'Verification failed')
      })
  }, [token])

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {status === 'verifying' ? 'Verifying your email...' : message}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === 'success' && (
            <Button onClick={() => navigate('/login')}>Go to login</Button>
          )}
          {status === 'error' && (
            <Button onClick={() => navigate('/dashboard')}>Go to dashboard</Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
