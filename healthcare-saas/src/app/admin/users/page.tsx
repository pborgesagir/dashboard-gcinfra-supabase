import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import UserManagement from '@/components/admin/UserManagement'

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <UserManagement />
      </AppLayout>
    </ProtectedRoute>
  )
}