import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/shared/navbar'
import { Sidebar } from '@/components/shared/sidebar'
import { LoginPage } from '@/features/auth/pages/login-page'
import { RegisterPage } from '@/features/auth/pages/register-page'
import { ForgotPasswordPage } from '@/features/auth/pages/forgot-password-page'
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page'
import { VerifyEmailPage } from '@/features/auth/pages/verify-email-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { ProfilePage } from '@/features/profile/pages/profile-page'
import { SecurityPage } from '@/features/security/pages/security-page'
import { SessionsPage } from '@/features/dashboard/pages/sessions-page'
import { PasskeysPage } from '@/features/dashboard/pages/passkeys-page'
import { MfaPage } from '@/features/dashboard/pages/mfa-page'
import { LoginHistoryPage } from '@/features/dashboard/pages/login-history-page'
import { AdminPage } from '@/features/admin/pages/admin-page'
import { AdminUsersPage } from '@/features/admin/pages/admin-users-page'
import { AdminUserDetailPage } from '@/features/admin/pages/admin-user-detail-page'
import { Skeleton } from '@/components/ui/skeleton'

function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function AdminRoute() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center"><Skeleton className="h-8 w-48" /></div>
  if (!user || user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}

function DashboardLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="dashboard/profile" element={<ProfilePage />} />
              <Route path="dashboard/security" element={<SecurityPage />} />
              <Route path="dashboard/sessions" element={<SessionsPage />} />
              <Route path="dashboard/passkeys" element={<PasskeysPage />} />
              <Route path="dashboard/mfa" element={<MfaPage />} />
              <Route path="dashboard/login-history" element={<LoginHistoryPage />} />
            </Route>
          </Route>
          <Route element={<AdminRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="admin" element={<AdminPage />} />
              <Route path="admin/users" element={<AdminUsersPage />} />
              <Route path="admin/users/:id" element={<AdminUserDetailPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function LandingPage() {
  const { user } = useAuth()
  if (user) return <Navigate to="/dashboard" replace />
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">AuthForge</h1>
      <p className="mt-4 max-w-xl text-lg text-muted-foreground">
        Production-ready Authentication Platform supporting multiple authentication methods with enterprise-grade security.
      </p>
      <div className="mt-8 flex gap-4">
        <a href="/register"><Button size="lg">Get Started</Button></a>
        <a href="/login"><Button variant="outline" size="lg">Sign In</Button></a>
      </div>
    </div>
  )
}
