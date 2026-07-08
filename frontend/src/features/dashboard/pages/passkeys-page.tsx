import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PasskeysPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['passkeys'],
    queryFn: () => api.get<{ status: string; data: { credentials: any[] } }>('/webauthn/credentials'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/webauthn/credentials/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['passkeys'] }),
  })

  const beginRegister = async () => {
    try {
      const options = await api.post<{ status: string; data: any }>('/webauthn/register/begin')
      const credential = await (navigator as any).credentials.create({
        publicKey: options.data,
      })
      await api.post('/webauthn/register/complete', { credential })
      queryClient.invalidateQueries({ queryKey: ['passkeys'] })
    } catch (err) {
      console.error('Passkey registration failed', err)
    }
  }

  const credentials = data?.data?.credentials || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Passkeys</h1>
          <p className="text-muted-foreground">Passwordless authentication with biometrics</p>
        </div>
        <Button onClick={beginRegister}>Register Passkey</Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : credentials.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No passkeys registered</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {credentials.map((cred: any) => (
            <Card key={cred.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{cred.deviceName || 'Unknown device'}</p>
                  <p className="text-sm text-muted-foreground">Added {new Date(cred.createdAt).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(cred.id)}>
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
