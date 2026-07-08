import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { User, Session } from '@/types'

export function DashboardPage() {
  const { user } = useAuth()

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.get<{ status: string; data: { sessions: Session[] } }>('/sessions'),
  })

  const stats = [
    { label: 'Account Status', value: user?.emailVerified ? 'Verified' : 'Unverified' },
    { label: 'Role', value: user?.role || '' },
    { label: 'Active Sessions', value: isLoading ? '...' : String(sessionsData?.data?.sessions?.length || 0) },
    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || user?.email}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
