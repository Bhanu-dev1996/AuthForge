import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Session } from '@/types'

export function SessionsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<{ status: string; data: { sessions: Session[] } }>('/sessions'),
  })

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const logoutAllMutation = useMutation({
    mutationFn: () => api.post('/auth/logout-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const sessions = data?.data?.sessions || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sessions</h1>
          <p className="text-muted-foreground">Manage your active sessions</p>
        </div>
        <Button variant="destructive" onClick={() => logoutAllMutation.mutate()} disabled={sessions.length === 0}>
          Logout All
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
      ) : sessions.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No active sessions</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{session.userAgent?.split(' ').slice(0, 2).join(' ') || 'Unknown device'}</p>
                    {session.isCurrent && <Badge>Current</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    IP: {session.ipAddress || 'Unknown'} · Last active: {new Date(session.lastUsedAt).toLocaleDateString()}
                  </p>
                </div>
                {!session.isCurrent && (
                  <Button variant="outline" size="sm" onClick={() => revokeMutation.mutate(session.id)}>
                    Revoke
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
