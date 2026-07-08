import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

export function MfaPage() {
  const [showSetup, setShowSetup] = useState(false)
  const [code, setCode] = useState('')
  const [setupData, setSetupData] = useState<any>(null)
  const [error, setError] = useState('')

  const { data: mfaStatus, refetch } = useQuery({
    queryKey: ['mfa-status'],
    queryFn: () => api.get<{ status: string; data: { enabled: boolean } }>('/mfa/status'),
  })

  const setupMutation = useMutation({
    mutationFn: () => api.post<{ status: string; data: any }>('/mfa/setup'),
    onSuccess: (data) => {
      setSetupData(data.data)
      setShowSetup(true)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: (otp: string) => api.post('/mfa/verify', { code: otp }),
    onSuccess: () => {
      setShowSetup(false)
      setSetupData(null)
      setCode('')
      refetch()
    },
    onError: (err: any) => setError(err?.error?.message || 'Verification failed'),
  })

  const disableMutation = useMutation({
    mutationFn: (otp: string) => api.post('/mfa/disable', { code: otp }),
    onSuccess: () => refetch(),
  })

  const isEnabled = mfaStatus?.data?.enabled

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Multi-Factor Authentication</h1>
        <p className="text-muted-foreground">Add an extra layer of security to your account</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{isEnabled ? 'MFA is enabled' : 'Enable MFA'}</CardTitle>
          <CardDescription>
            {isEnabled
              ? 'Your account is protected with TOTP authentication'
              : 'Use an authenticator app to generate one-time codes'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEnabled && !showSetup && (
            <Button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending}>
              Set up MFA
            </Button>
          )}
          {showSetup && setupData && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="mb-2 text-sm font-medium">Scan this QR code with your authenticator app:</p>
                <img src={setupData.qrCode} alt="QR Code" className="mx-auto h-48 w-48" />
                <p className="mt-2 text-xs text-muted-foreground break-all">Secret: {setupData.secret}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Enter 6-digit code from app</Label>
                <Input id="mfa-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={() => verifyMutation.mutate(code)} disabled={code.length !== 6}>
                Verify & Enable
              </Button>
            </div>
          )}
          {isEnabled && (
            <div>
              <p className="mb-4 text-sm text-muted-foreground">Enter your current TOTP code to disable MFA</p>
              <div className="flex gap-2">
                <Input
                  className="max-w-[200px]"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                />
                <Button variant="destructive" onClick={() => disableMutation.mutate(code)} disabled={code.length !== 6}>
                  Disable
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
