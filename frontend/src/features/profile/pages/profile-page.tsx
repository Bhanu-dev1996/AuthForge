import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) => api.patch('/users/me', data),
    onSuccess: () => {
      setSuccess('Profile updated')
      refreshUser()
    },
    onError: (err: any) => setError(err?.error?.message || 'Update failed'),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image || undefined} />
              <AvatarFallback className="text-lg">{user?.name?.[0] || user?.email[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user?.name || 'User'}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate({ name })
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">
                {user?.emailVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <Button type="submit" disabled={updateMutation.isPending}>
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
