import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function AdminPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get<{ status: string; data: any }>('/admin/analytics'),
  })

  const stats = data?.data || {}

  const cards = [
    { label: 'Total Users', value: stats.totalUsers },
    { label: 'Active Users', value: stats.activeUsers },
    { label: 'Total Logins', value: stats.totalLogins },
    { label: 'Failed Logins', value: stats.failedLogins },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform analytics and management</p>
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{card.value ?? '—'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {stats.loginsByProvider && (
            <Card>
              <CardHeader>
                <CardTitle>Logins by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.loginsByProvider).map(([provider, count]: [string, any]) => (
                    <div key={provider} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{provider}</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
