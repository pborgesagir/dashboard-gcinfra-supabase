import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import DashboardContent from '@/components/dashboard/DashboardContent'

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="manager">
      <AppLayout>
        <DashboardContent />
      </AppLayout>
    </ProtectedRoute>
  )
}