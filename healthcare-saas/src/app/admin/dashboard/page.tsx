import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import BenchmarkingDashboardContent from '@/components/dashboard/BenchmarkingDashboardContent'

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <BenchmarkingDashboardContent />
      </AppLayout>
    </ProtectedRoute>
  )
}