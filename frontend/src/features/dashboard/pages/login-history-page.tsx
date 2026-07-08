import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export function LoginHistoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['login-history'],
    queryFn: () => api.get<{ status: string; data: { history: any[] } }>('/sessions/login-history'),
  })

  const history = data?.data?.history || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Login History</h1>
        <p className="text-muted-foreground">Recent login activity on your account</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : history.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No login history</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {history.map((entry: any) => (
            <Card key={entry.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Badge variant={entry.success ? 'default' : 'destructive'}>
                    {entry.success ? 'Success' : 'Failed'}
                  </Badge>
                  <div>
                    <p className="text-sm">IP: {entry.ipAddress}</p>
                    <p className="text-xs text-muted-foreground">{entry.userAgent?.substring(0, 60)}</p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(entry.attemptedAt).toLocaleString()}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
