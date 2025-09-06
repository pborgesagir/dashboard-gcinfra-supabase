import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import DashboardContent from '@/components/dashboard/DashboardContent'

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </ProtectedRoute>
  )
}