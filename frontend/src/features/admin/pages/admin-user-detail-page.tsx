import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: () => api.get<{ status: string; data: any }>(`/admin/users/${id}`),
    enabled: !!id,
  })

  const blockMutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${id}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user', id] }),
  })

  const unblockMutation = useMutation({
    mutationFn: () => api.post(`/admin/users/${id}/unblock`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user', id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/admin/users/${id}`),
    onSuccess: () => navigate('/admin/users'),
  })

  const makeAdminMutation = useMutation({
    mutationFn: () => api.patch(`/admin/users/${id}/role`, { role: 'admin' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-user', id] }),
  })

  if (isLoading) return <Skeleton className="h-60 w-full" />
  if (!data?.data) return <p>User not found</p>

  const { user, sessions, oauthAccounts, passkeys, mfaMethods, loginAttempts } = data.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{user.name || user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-2">
          {user.isBlocked ? (
            <Button variant="outline" onClick={() => unblockMutation.mutate()}>Unblock</Button>
          ) : (
            <Button variant="destructive" onClick={() => blockMutation.mutate()}>Block</Button>
          )}
          {user.role !== 'admin' && (
            <Button variant="outline" onClick={() => makeAdminMutation.mutate()}>Make Admin</Button>
          )}
          <Button variant="destructive" onClick={() => { if (confirm('Delete this user?')) deleteMutation.mutate() }}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge>{user.role}</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email Verified</span><span>{user.emailVerified ? new Date(user.emailVerified).toLocaleDateString() : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Blocked</span><span>{user.isBlocked ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{new Date(user.createdAt).toLocaleDateString()}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stats</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Sessions</span><span>{sessions?.length || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">OAuth Accounts</span><span>{oauthAccounts?.length || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Passkeys</span><span>{passkeys?.length || 0}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">MFA Enabled</span><span>{mfaMethods?.some((m: any) => m.enabled) ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Login Attempts</span><span>{loginAttempts?.length || 0}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
