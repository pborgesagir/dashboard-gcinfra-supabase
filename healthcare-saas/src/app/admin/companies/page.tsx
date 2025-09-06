import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import CompanyManagement from '@/components/admin/CompanyManagement'

export default function AdminCompaniesPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AppLayout>
        <CompanyManagement />
      </AppLayout>
    </ProtectedRoute>
  )
}