import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import BuildingDashboardContent from '@/components/dashboard/BuildingDashboardContent'

export default function AdminBuildingPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <BuildingDashboardContent />
      </AppLayout>
    </ProtectedRoute>
  )
}