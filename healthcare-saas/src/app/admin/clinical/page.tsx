import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import ClinicalDashboardContent from '@/components/dashboard/ClinicalDashboardContent'

export default function AdminClinicalPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <ClinicalDashboardContent />
      </AppLayout>
    </ProtectedRoute>
  )
}